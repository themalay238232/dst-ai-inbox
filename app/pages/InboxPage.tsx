"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  adminLogin,
  clearAdminToken,
  ConversationError,
  fetchAdminConversation,
  fetchInbox,
  loadAdminToken,
  prepareImage,
  saveAdminToken,
  sendStaffReply,
  setConversationStatus,
  setConversationTakeover,
  type AdminConversation,
  type ConversationSummary,
} from "../lib/dst-conversation";

/** Nhip lam moi danh sach. Du nhanh de nhan vien thay tin moi, du cham de khong
 *  banh so lan doc KV len. */
const REFRESH_MS = 6_000;

const STATUS_LABEL: Record<string, string> = {
  new: "Mới",
  open: "Đang xử lý",
  resolved: "Đã xử lý",
};

const SENDER_LABEL: Record<string, string> = {
  customer: "Khách",
  bot: "Bot",
  staff: "Nhân viên",
};

function timeLabel(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });
}

function errorMessage(error: unknown) {
  if (!(error instanceof ConversationError)) return "Có lỗi xảy ra. Vui lòng thử lại.";
  if (error.status === 0) return "Mất kết nối tới máy chủ.";
  if (error.status === 401) return "Phiên đăng nhập đã hết hạn.";
  if (error.message === "MESSENGER_NOT_CONNECTED") {
    return "Messenger chưa kết nối. Chưa điền MESSENGER_ADMIN_TOKEN trong .env.local nên không gửi được.";
  }
  if (error.message === "MESSENGER_WINDOW_EXPIRED") {
    return "Đã quá 24 giờ kể từ tin nhắn cuối của khách. Meta không cho Trang chủ động nhắn lại; cần khách nhắn trước.";
  }
  if (error.message === "MESSENGER_SEND_FAILED") {
    return "Meta từ chối gửi tin này. Kiểm tra quyền nhắn tin của Trang trong Facebook Business.";
  }
  if (error.message === "MESSENGER_IMAGE_UNSUPPORTED") {
    return "Hội thoại Messenger hiện chỉ gửi được văn bản, chưa gửi được ảnh.";
  }
  if (error.message === "MESSENGER_READ_ONLY") {
    return "Trạng thái và bot của hội thoại Messenger do hệ thống Messenger quản lý, không đổi từ đây được.";
  }
  return "Không thực hiện được thao tác. Vui lòng thử lại.";
}

export function InboxPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [messengerConfigured, setMessengerConfigured] = useState(false);
  const [messengerError, setMessengerError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<AdminConversation | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reply, setReply] = useState("");
  const [pendingImage, setPendingImage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  /** Moc thoi gian hien tai, cap nhat moi phut. Dung de dem nguoc cua so 24 gio cua
   *  Meta ma khong phai goi Date.now() trong than render. */
  const [now, setNow] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 60_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    // Hoan sang tick sau de khong goi setState ngay trong than effect.
    const timer = window.setTimeout(() => setToken(loadAdminToken()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchInbox(token, { query, status: statusFilter });
      setConversations(data.conversations);
      setMessengerConfigured(data.messengerConfigured);
      setMessengerError(data.messengerError ?? "");
    } catch (requestError) {
      if (requestError instanceof ConversationError && requestError.status === 401) {
        clearAdminToken();
        setToken("");
      }
    }
  }, [token, query, statusFilter]);

  useEffect(() => {
    if (!token) return;
    const first = window.setTimeout(() => void refresh(), 0);
    const timer = window.setInterval(() => void refresh(), REFRESH_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [refresh, token]);

  const loadDetail = useCallback(async (conversationId: string) => {
    if (!token || !conversationId) return;
    try {
      const data = await fetchAdminConversation(token, conversationId);
      setDetail(data.conversation);
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  }, [token]);

  useEffect(() => {
    if (!selectedId) return;
    const first = window.setTimeout(() => void loadDetail(selectedId), 0);
    const timer = window.setInterval(() => void loadDetail(selectedId), REFRESH_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [loadDetail, selectedId]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [detail?.messages.length]);

  /**
   * Cua so 24 gio cua Meta, tinh tu tin cuoi CUA KHACH (tin bot tra loi khong lam moi
   * cua so). Bao cho nhan vien TRUOC khi go, thay vi de ho soan xong roi moi bao loi.
   */
  const messengerWindow = useMemo(() => {
    // `now` la moc thoi gian do effect cap nhat, khong goi Date.now() ngay trong
    // render: ham do khong thuan khiet, ket qua se doi moi lan React ve lai.
    if (!now || !detail || detail.channel !== "messenger") return null;
    const last = [...detail.messages].reverse().find((item) => item.sender === "customer");
    if (!last) return null;
    const at = new Date(last.createdAt).getTime();
    if (!Number.isFinite(at)) return null;
    const leftMs = 24 * 60 * 60 * 1000 - (now - at);
    return { expired: leftMs <= 0, hoursLeft: Math.max(0, Math.floor(leftMs / 3_600_000)), at: last.createdAt };
  }, [detail, now]);

  const counts = useMemo(() => ({
    all: conversations.length,
    new: conversations.filter((item) => item.status === "new").length,
    open: conversations.filter((item) => item.status === "open").length,
    resolved: conversations.filter((item) => item.status === "resolved").length,
  }), [conversations]);

  async function onLogin(event: React.FormEvent) {
    event.preventDefault();
    setLoggingIn(true);
    setLoginError("");
    try {
      const issued = await adminLogin(password);
      saveAdminToken(issued);
      setToken(issued);
      setPassword("");
    } catch (requestError) {
      setLoginError(
        // Khong nhac .env.local: tren ban deploy thi mat khau la secret cua Worker,
        // noi ".env.local" o do la chi sai cho.
        requestError instanceof ConversationError && requestError.message === "ADMIN_NOT_CONFIGURED"
          ? "Máy chủ chưa cấu hình mật khẩu quản trị (ADMIN_PASSWORD)."
          : "Mật khẩu không đúng.",
      );
    } finally {
      setLoggingIn(false);
    }
  }

  async function act(run: () => Promise<AdminConversation>) {
    setBusy(true);
    setError("");
    try {
      setDetail(await run());
      await refresh();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  async function onReply(event: React.FormEvent) {
    event.preventDefault();
    if (!detail || (!reply.trim() && !pendingImage)) return;
    const content = reply.trim();
    const image = pendingImage;
    await act(async () => {
      const data = await sendStaffReply(token, {
        conversationId: detail.conversationId,
        content,
        ...(image ? { imageDataUrl: image } : {}),
        // Messenger gui theo PSID cua khach, khong theo ma hoi thoai.
        ...(detail.channel === "messenger" ? { participantId: detail.customerId } : {}),
      });
      setReply("");
      setPendingImage("");
      return data.conversation;
    });
  }

  async function onPickImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    try {
      setPendingImage(await prepareImage(file));
    } catch {
      setError("Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP dưới mức cho phép.");
    }
  }

  if (!token) {
    return (
      <div className="inbox-gate">
        <form className="inbox-gate-card" onSubmit={onLogin}>
          <h1>Hộp thư DST</h1>
          <p>Khu vực nội bộ. Nhập mật khẩu quản trị để tiếp tục.</p>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mật khẩu quản trị"
            aria-label="Mật khẩu quản trị"
            autoComplete="current-password"
          />
          <button type="submit" disabled={loggingIn || !password}>
            {loggingIn ? "Đang kiểm tra…" : "Đăng nhập"}
          </button>
          {loginError ? <p className="inbox-error" role="alert">{loginError}</p> : null}
        </form>
      </div>
    );
  }

  return (
    <div className="inbox-shell">
      <header className="inbox-topbar">
        <div>
          <strong>Hộp thư DST</strong>
          <span>{counts.all} hội thoại · {counts.new} mới</span>
        </div>
        <div className="inbox-topbar-actions">
          <span className={`inbox-chip ${messengerConfigured && !messengerError ? "is-on" : "is-off"}`}>
            {messengerError
              ? "Messenger lỗi kết nối"
              : messengerConfigured ? "Messenger đã kết nối" : "Messenger chưa kết nối"}
          </span>
          <button type="button" onClick={() => { clearAdminToken(); setToken(""); }}>Đăng xuất</button>
        </div>
      </header>

      <div className="inbox-body">
        <aside className="inbox-list" aria-label="Danh sách hội thoại">
          <div className="inbox-filters">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo nội dung hoặc mã phiên"
              aria-label="Tìm hội thoại"
            />
            <div className="inbox-status-tabs" role="tablist">
              {(["all", "new", "open", "resolved"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === value}
                  className={statusFilter === value ? "is-active" : ""}
                  onClick={() => setStatusFilter(value)}
                >
                  {value === "all" ? "Tất cả" : STATUS_LABEL[value]} ({counts[value]})
                </button>
              ))}
            </div>
          </div>
          <ul>
            {conversations.length === 0 ? (
              <li className="inbox-empty">Chưa có hội thoại nào.</li>
            ) : conversations.map((item) => (
              <li key={item.conversationId}>
                <button
                  type="button"
                  className={item.conversationId === selectedId ? "is-active" : ""}
                  onClick={() => setSelectedId(item.conversationId)}
                >
                  <span className="inbox-row-top">
                    <span className={`inbox-tag ${item.channel}`}>
                      {item.channel === "web" ? "Website" : "Messenger"}
                    </span>
                    <span className={`inbox-state ${item.status}`}>{STATUS_LABEL[item.status]}</span>
                  </span>
                  <span className="inbox-row-preview">{item.preview || "(chưa có nội dung)"}</span>
                  <span className="inbox-row-meta">
                    {item.customerName || item.conversationId.slice(0, 8)} · {timeLabel(item.lastMessageAt)}
                    {item.aiEnabled ? "" : " · nhân viên phụ trách"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="inbox-thread" aria-label="Nội dung hội thoại">
          {!detail ? (
            <p className="inbox-empty">Chọn một hội thoại ở bên trái để xem nội dung.</p>
          ) : (
            <>
              <div className="inbox-messages" ref={threadRef}>
                {detail.messages.map((message) => (
                  <article key={message.id} className={`inbox-message ${message.sender}`}>
                    <header>
                      <strong>{SENDER_LABEL[message.sender]}</strong>
                      <time>{timeLabel(message.createdAt)}</time>
                    </header>
                    {message.content ? <p>{message.content}</p> : null}
                    {message.imageUrl ? <img src={message.imageUrl} alt="Ảnh trong hội thoại" /> : null}
                  </article>
                ))}
              </div>

              {error ? <p className="inbox-error" role="alert">{error}</p> : null}

              {pendingImage ? (
                <div className="inbox-attachment">
                  <img src={pendingImage} alt="Ảnh sắp gửi" />
                  <button type="button" onClick={() => setPendingImage("")}>Bỏ ảnh</button>
                </div>
              ) : null}

              {messengerWindow ? (
                <p className={`inbox-window ${messengerWindow.expired ? "is-expired" : ""}`} role="status">
                  {messengerWindow.expired
                    ? `Quá cửa sổ 24 giờ của Meta (khách nhắn lần cuối ${timeLabel(messengerWindow.at)}). Không gửi chủ động được — cần khách nhắn lại trước.`
                    : `Còn khoảng ${messengerWindow.hoursLeft} giờ trong cửa sổ 24 giờ của Meta.`}
                </p>
              ) : null}

              <form className="inbox-composer" onSubmit={onReply}>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={onPickImage}
                  hidden
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={busy || detail.channel === "messenger"}
                  title={detail.channel === "messenger" ? "Messenger chưa gửi được ảnh từ hộp thư này" : undefined}
                >
                  Ảnh
                </button>
                <input
                  type="text"
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  disabled={Boolean(messengerWindow?.expired)}
                  placeholder={messengerWindow?.expired
                    ? "Hết cửa sổ 24 giờ, chờ khách nhắn lại"
                    : detail.aiEnabled && detail.channel === "web"
                      ? "Trả lời khách (bot vẫn đang bật)"
                      : "Trả lời khách"}
                  aria-label="Nội dung trả lời"
                />
                <button
                  type="submit"
                  disabled={busy || Boolean(messengerWindow?.expired) || (!reply.trim() && !pendingImage)}
                >
                  Gửi
                </button>
              </form>
            </>
          )}
        </section>

        <aside className="inbox-detail" aria-label="Thông tin phiên">
          {!detail ? <p className="inbox-empty">Chưa chọn hội thoại.</p> : (
            <>
              <h2>Thông tin phiên</h2>
              <dl>
                <dt>Nguồn</dt>
                <dd><span className={`inbox-tag ${detail.channel}`}>{detail.channel === "web" ? "Website" : "Messenger"}</span></dd>
                <dt>Mã phiên</dt>
                <dd className="inbox-mono">{detail.conversationId}</dd>
                <dt>Khách</dt>
                <dd>{detail.customerName || "(ẩn danh)"}</dd>
                <dt>Mã khách</dt>
                <dd className="inbox-mono">{detail.customerId}</dd>
                <dt>Tin nhắn</dt>
                <dd>{detail.messages.length}</dd>
                <dt>Cập nhật</dt>
                <dd>{timeLabel(detail.lastMessageAt)}</dd>
                <dt>Phụ trách</dt>
                <dd>{detail.assignedTo || "Chưa ai nhận"}</dd>
              </dl>

              <h3>Trạng thái</h3>
              {detail.channel === "messenger" ? (
                <p className="inbox-hint">
                  Hội thoại Messenger do worker Messenger của DST quản lý. Tại đây chỉ đọc và
                  trả lời khách; trạng thái và bật/tắt bot phải chỉnh ở hệ thống đó.
                </p>
              ) : null}
              <div className="inbox-status-actions">
                {(["new", "open", "resolved"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    disabled={busy || detail.channel === "messenger" || detail.status === value}
                    className={detail.status === value ? "is-active" : ""}
                    onClick={() => void act(async () =>
                      (await setConversationStatus(token, detail.conversationId, value)).conversation)}
                  >
                    {STATUS_LABEL[value]}
                  </button>
                ))}
              </div>

              <h3>Bot</h3>
              <p className="inbox-hint">
                {detail.channel === "messenger"
                  ? "Bot Messenger chạy ở hệ thống riêng, không tắt được từ hộp thư này."
                  : detail.aiEnabled
                    ? "Bot đang tự trả lời khách trong phiên này."
                    : "Nhân viên đã tiếp quản. Bot không trả lời trong phiên này nữa."}
              </p>
              <button
                type="button"
                className="inbox-primary"
                disabled={busy || detail.channel === "messenger"}
                onClick={() => void act(async () => (await setConversationTakeover(token, {
                  conversationId: detail.conversationId,
                  takeOver: detail.aiEnabled,
                })).conversation)}
              >
                {detail.aiEnabled ? "Tiếp quản hội thoại" : "Trả lại cho bot"}
              </button>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
