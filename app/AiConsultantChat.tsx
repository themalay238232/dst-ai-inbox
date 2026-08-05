"use client";

import { Bot, ExternalLink, Headset, ImagePlus, MessageCircle, Minimize2, Phone, Send, Trash2, User, UsersRound, X, Zap } from "lucide-react";
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { company } from "../data/company";
import { hasConfiguredValue } from "../data/companyConfig";
import { services } from "../data/services";
import { trackEvent } from "./lib/tracking";
import { AppLink } from "./components/AppLink";
import {
  clearConversationId,
  ConversationError,
  deleteCustomerHistory,
  fetchCustomerHistory,
  loadConversationId,
  prepareImage,
  saveConversationId,
  sendCustomerMessage,
  type ConversationMessage,
} from "./lib/dst-conversation";

type ChatRole = "assistant" | "user";
type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  /** Tin cua nhan vien phai nhin ra ngay la nguoi that, khong phai bot. */
  fromStaff?: boolean;
  imageUrl?: string;
};

/** Nhip hoi tin moi khi khung chat dang mo. Chi de nhan cau tra loi cua nhan vien
 *  trong hop thu; bot tra loi ngay trong response nen khong phu thuoc nhip nay. */
const POLL_MS = 5_000;

/**
 * Model thinh thoang van tra ve markdown du prompt da cam. Chuyen `**dam**` thanh the
 * <strong> va bo cap dau sao di.
 *
 * Tach thanh mang node React thay vi dung dangerouslySetInnerHTML: noi dung nay do
 * model sinh ra, khong duoc phep chen HTML vao trang.
 */
function renderRich(text: string) {
  // Dung [\s\S] thay vi co `s`: tsconfig dang nham muc tieu ES2017, chua ho tro co do.
  return text.split(/\*\*([\s\S]+?)\*\*/g).map((part, index) => (
    index % 2 === 1 ? <strong key={index}>{part}</strong> : part
  ));
}

function toChatMessage(message: ConversationMessage): ChatMessage {
  return {
    id: message.id,
    role: message.sender === "customer" ? "user" : "assistant",
    text: message.content,
    ...(message.sender === "staff" ? { fromStaff: true } : {}),
    ...(message.imageUrl ? { imageUrl: message.imageUrl } : {}),
  };
}

type AiConsultantChatProps = {
  currentPath: string;
  openToken: number;
  onNavigate: (path: string) => void;
};

const sendCooldownMs = 900;

function serviceFromPath(path: string) {
  return services.find((service) => path.endsWith(`/dich-vu/${service.slug}`));
}

function greetingsFor(path: string) {
  const service = serviceFromPath(path);
  return service
    ? `Xin chào, tôi là trợ lý tư vấn DST. Bạn đang xem dịch vụ ${service.title}. Bạn muốn trao đổi về mục tiêu, hạng mục hay cách triển khai?`
    : "Xin chào, tôi là trợ lý tư vấn DST. Bạn có thể mô tả mục tiêu hoặc chọn một câu hỏi nhanh để tôi gợi ý hướng trao đổi phù hợp.";
}

function quickQuestionsFor(path: string) {
  const service = serviceFromPath(path);
  if (service) return [
    `Dịch vụ ${service.title} phù hợp khi nào?`,
    `Các hạng mục của ${service.title} gồm gì?`,
    "Tôi muốn nhận tư vấn theo mục tiêu kinh doanh",
  ];
  if (path.startsWith("/du-an")) return ["DST tổ chức một dự án từ đâu?", "Tôi muốn trao đổi về phạm vi phù hợp", "Quy trình bắt đầu dự án là gì?"];
  if (path.startsWith("/tuyen-dung")) return ["DST đang công bố vị trí nào?", "Tôi muốn hỏi về môi trường làm việc", "Tôi muốn kết nối với DST"];
  return ["Tôi muốn chạy quảng cáo", "Tư vấn TikTok Shop", "Cần thiết kế website", "Tôi cần Media hoặc Branding"];
}

export function AiConsultantChat({ currentPath, openToken, onNavigate }: AiConsultantChatProps) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: "welcome", role: "assistant", text: greetingsFor(currentPath) }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [canSend, setCanSend] = useState(true);
  const [fallbackNotice, setFallbackNotice] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [pendingImage, setPendingImage] = useState("");
  const [handedOver, setHandedOver] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const messageCounter = useRef(0);
  const cooldownTimerRef = useRef<number | null>(null);
  const quickQuestions = useMemo(() => quickQuestionsFor(currentPath), [currentPath]);

  /** Nap lich su tu MAY CHU theo conversationId. Trinh duyet chi giu ma phien, con
   *  noi dung nam trong kho hoi thoai dung chung voi hop thu quan tri. */
  const syncFromServer = useCallback(async (id: string) => {
    if (!id) return;
    try {
      const conversation = await fetchCustomerHistory(id);
      if (!conversation) return;
      setMessages(conversation.messages.map(toChatMessage));
      setHandedOver(!conversation.aiEnabled);
    } catch {
      // Mat mang thi giu nguyen man hinh dang co, khong xoa lich su cua khach.
    }
  }, []);

  useEffect(() => {
    // Hoan sang tick sau: goi setState ngay trong than effect gay chuoi render thua
    // (quy tac react-hooks/set-state-in-effect).
    const restore = window.setTimeout(() => {
      const saved = loadConversationId();
      setConversationId(saved);
      if (saved) void syncFromServer(saved);
    }, 0);
    return () => window.clearTimeout(restore);
  }, [syncFromServer]);

  // Nhan vien tra loi trong hop thu -> khach thay ngay ma khong phai tai lai trang.
  useEffect(() => {
    if (!open || !conversationId) return;
    const timer = window.setInterval(() => void syncFromServer(conversationId), POLL_MS);
    return () => window.clearInterval(timer);
  }, [open, conversationId, syncFromServer]);

  useEffect(() => () => {
    if (cooldownTimerRef.current) window.clearTimeout(cooldownTimerRef.current);
  }, []);

  useEffect(() => {
    if (!openToken) return;
    const frame = window.requestAnimationFrame(() => {
      setDismissed(false);
      setOpen(true);
      trackEvent("chat_open", { source: "page" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [openToken]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(timer);
    };
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  /** Chi de hien tam tin cua khach trong luc cho may chu. Ngay sau do danh sach duoc
   *  thay bang ban tu may chu, nen khong can cat bot o day nua. */
  function appendMessage(role: ChatRole, text: string) {
    messageCounter.current += 1;
    const message = { id: `${role}-${messageCounter.current}`, role, text };
    setMessages((current) => [...current, message]);
    return message;
  }

  async function clearHistory() {
    const welcome = { id: `welcome-${Date.now()}`, role: "assistant" as const, text: greetingsFor(currentPath) };
    messageCounter.current = 0;
    // Xoa ca tren MAY CHU, khong chi tren man hinh: neu chi xoa phia trinh duyet thi
    // hoi thoai van con trong hop thu va khach tuong da xoa.
    if (conversationId) {
      try {
        await deleteCustomerHistory(conversationId);
      } catch {
        // Xoa duoc tren man hinh la du de khach tiep tuc; lan gui sau se mo phien moi.
      }
    }
    clearConversationId();
    setConversationId("");
    setHandedOver(false);
    setPendingImage("");
    setMessages([welcome]);
    setFallbackNotice("");
  }

  function toggleChat() {
    setOpen((current) => {
      const next = !current;
      if (next) trackEvent("chat_open", { source: "widget" });
      return next;
    });
  }

  async function sendQuestion(rawQuestion: string) {
    const question = rawQuestion.trim();
    const image = pendingImage;
    if ((!question && !image) || loading) return;
    if (!canSend) {
      setFallbackNotice("Vui lòng chờ một chút trước khi gửi câu hỏi tiếp theo.");
      return;
    }

    setCanSend(false);
    cooldownTimerRef.current = window.setTimeout(() => {
      cooldownTimerRef.current = null;
      setCanSend(true);
    }, sendCooldownMs);
    setFallbackNotice("");
    // Hien ngay tin cua khach de khung chat khong dung im trong luc cho may chu.
    appendMessage("user", question || "[Đã gửi một ảnh]");
    setInput("");
    setLoading(true);
    trackEvent("chat_message_sent", { path: currentPath });

    const service = serviceFromPath(currentPath);
    try {
      const result = await sendCustomerMessage({
        conversationId,
        message: question,
        ...(image ? { imageDataUrl: image } : {}),
        pageContext: currentPath,
        ...(service ? {
          serviceContext: `${service.title}. ${service.description}`.slice(0, 900),
        } : {}),
      });
      if (result.conversationId !== conversationId) {
        setConversationId(result.conversationId);
        saveConversationId(result.conversationId);
      }
      setPendingImage("");
      setHandedOver(Boolean(result.handedOver));
      setMessages(result.conversation.messages.map(toChatMessage));
      if (result.handedOver) {
        setFallbackNotice("Nhân viên DST đang trực tiếp hỗ trợ bạn. Vui lòng chờ trong giây lát.");
      }
    } catch (requestError) {
      // KHONG bia cau tra loi thay the. Tin cua khach da duoc luu tren may chu nen
      // nhan vien van thay trong hop thu va tra loi tay duoc.
      const code = requestError instanceof ConversationError ? requestError.message : "";
      const status = requestError instanceof ConversationError ? requestError.status : -1;
      if (status === 0) {
        setFallbackNotice("Mất kết nối tới máy chủ. Bạn kiểm tra mạng rồi gửi lại giúp DST nhé.");
      } else if (code === "AI_NOT_CONFIGURED") {
        setFallbackNotice(`Trợ lý AI chưa được cấu hình nên chưa trả lời tự động được. Câu hỏi của bạn đã được ghi nhận, nhân viên DST sẽ phản hồi. Cần gấp, bạn gọi ${company.phoneDisplay || company.phone} giúp DST.`);
      } else {
        setFallbackNotice("Trợ lý chưa trả lời được lúc này. Câu hỏi của bạn đã được ghi nhận và nhân viên DST sẽ phản hồi sớm.");
      }
      if (conversationId) void syncFromServer(conversationId);
    } finally {
      setLoading(false);
    }
  }

  async function onPickImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    try {
      setPendingImage(await prepareImage(file));
      setFallbackNotice("");
    } catch {
      setFallbackNotice("Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP và dung lượng vừa phải.");
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendQuestion(input);
  }

  if (dismissed) {
    return <button className="ai-chat-restore" type="button" onClick={() => { setDismissed(false); setOpen(true); trackEvent("chat_open", { source: "restore" }); }} aria-label="Mở lại AI Chat"><Bot size={20} aria-hidden="true" /></button>;
  }

  return (
    <section className={`ai-chat ${open ? "is-open" : ""}`} aria-label="Trợ lý tư vấn DST Group">
      {open ? (
        <div className="ai-chat-panel" role="dialog" aria-modal="false" aria-label="AI Chat tư vấn DST Group">
          <header className="ai-chat-header">
            <div><span><Bot size={17} aria-hidden="true" />AI tư vấn DST</span><p>Marketing, Media, Branding</p></div>
            <div className="ai-chat-actions">
              <button type="button" onClick={() => void clearHistory()} aria-label="Xóa lịch sử trò chuyện" title="Xóa lịch sử"><Trash2 size={16} aria-hidden="true" /></button>
              <button type="button" onClick={() => setOpen(false)} aria-label="Thu nhỏ chat" title="Thu nhỏ"><Minimize2 size={18} aria-hidden="true" /></button>
              <button type="button" onClick={() => setDismissed(true)} aria-label="Đóng chat" title="Đóng chat"><X size={18} aria-hidden="true" /></button>
            </div>
          </header>
          <div className="ai-chat-messages" aria-live="polite" ref={scrollRef}>
            {messages.map((message) => (
              <article className={`ai-message ${message.role}${message.fromStaff ? " is-staff" : ""}`} key={message.id}>
                <span>{message.role === "user" ? <User size={15} /> : message.fromStaff ? <Headset size={15} /> : <Bot size={15} />}</span>
                <div>
                  {message.fromStaff ? <em className="ai-message-who">Nhân viên DST</em> : null}
                  {message.text ? <p>{renderRich(message.text)}</p> : null}
                  {message.imageUrl ? <img className="ai-message-image" src={message.imageUrl} alt="Ảnh trong hội thoại" /> : null}
                </div>
              </article>
            ))}
            {loading ? <article className="ai-message assistant"><span><Bot size={15} /></span><p>Đang xem lại nhu cầu của bạn...</p></article> : null}
          </div>
          {fallbackNotice ? <p className="ai-fallback-notice" role="status">{fallbackNotice}</p> : null}
          <div className="ai-quick-list" aria-label="Câu hỏi nhanh">{quickQuestions.map((question) => <button type="button" key={question} onClick={() => void sendQuestion(question)} disabled={loading}>{question}</button>)}</div>
          {pendingImage ? (
            <div className="ai-chat-attachment">
              <img src={pendingImage} alt="Ảnh sắp gửi" />
              <span>Ảnh đã chọn</span>
              <button type="button" onClick={() => setPendingImage("")} aria-label="Bỏ ảnh đã chọn"><X size={14} aria-hidden="true" /></button>
            </div>
          ) : null}
          <form className="ai-chat-input" onSubmit={onSubmit}>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void onPickImage(event)} hidden />
            <button type="button" className="ai-chat-attach" onClick={() => fileRef.current?.click()} disabled={loading} aria-label="Gửi ảnh cho trợ lý" title="Gửi ảnh"><ImagePlus size={17} aria-hidden="true" /></button>
            <input ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} placeholder={handedOver ? "Nhân viên DST đang hỗ trợ..." : "Nhập câu hỏi tư vấn..."} aria-label="Nhập câu hỏi tư vấn" maxLength={800} />
            <button type="submit" disabled={(!input.trim() && !pendingImage) || loading} aria-label="Gửi câu hỏi"><Send size={17} aria-hidden="true" /></button>
          </form>
          <div className="ai-chat-contact-links"><AppLink to="/lien-he" onNavigate={onNavigate} onClick={() => trackEvent("cta_consultation", { source: "ai_chat" })}><UsersRound size={15} aria-hidden="true" />Gặp tư vấn viên</AppLink>{hasConfiguredValue(company.zaloUrl) ? <a href={company.zaloUrl} onClick={() => trackEvent("zalo_click", { source: "ai_chat" })} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} aria-hidden="true" />Chat Zalo</a> : null}{hasConfiguredValue(company.phone) ? <a href={`tel:${company.phone}`} onClick={() => trackEvent("phone_click", { source: "ai_chat" })}><Phone size={15} aria-hidden="true" />{company.phoneDisplay || company.phone}</a> : null}</div>
          <p className="ai-chat-disclaimer">Nội dung do AI hỗ trợ và có thể cần nhân viên DST Group xác nhận. Hội thoại được lưu để đội ngũ DST hỗ trợ tiếp; không gửi mật khẩu, mã OTP hoặc dữ liệu nhạy cảm.</p>
          <AppLink className="ai-chat-privacy" to="/chinh-sach-bao-mat" onNavigate={onNavigate}>Chính sách bảo mật</AppLink>
        </div>
      ) : null}
      <button className="ai-chat-toggle" type="button" onClick={toggleChat} aria-expanded={open} aria-label={open ? "Thu nhỏ AI Chat" : "Mở AI Chat"}>
        <MessageCircle size={22} aria-hidden="true" /><span><strong>Tư vấn AI</strong><small>Phản hồi nhanh</small></span><Zap size={16} aria-hidden="true" />
      </button>
    </section>
  );
}
