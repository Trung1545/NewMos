import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Bot,
  Sparkles,
  Zap,
  X,
  Send,
  ExternalLink,
  RotateCcw,
  Package,
  CheckCircle2,
  ChevronRight,
  ShoppingBag,
  Info,
} from 'lucide-react';
import { useChatbotStore } from '../../stores/useChatbotStore';
import { formatCurrency, cn } from '../../lib/utils';

export function NewMosChatbot() {
  const navigate = useNavigate();
  const {
    isOpen,
    isTyping,
    productContext,
    messages,
    toggleChat,
    closeChat,
    clearProductContext,
    clearMessages,
    sendMessage,
  } = useChatbotStore();

  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Tự động cuộn xuống cuối khi có tin nhắn mới hoặc bot đang phản hồi
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Tự động focus vào ô nhập tin nhắn khi mở
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen, messages, isTyping]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isTyping) return;

    const text = inputMessage;
    setInputMessage('');
    await sendMessage(text);
  };

  const handleQuickPrompt = async (promptText) => {
    if (isTyping) return;
    await sendMessage(promptText);
  };

  const handleProductClick = (product) => {
    // Điều hướng đến trang chi tiết sản phẩm
    if (product.slug) {
      navigate(`/product/${product.slug}`);
    } else if (product.id) {
      navigate(`/product/${product.id}`);
    }
  };

  return (
    <>
      {/* 1. NÚT BẬT/TẮT NỔI (Floating Trigger Button) */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {/* Tooltip / Badge thu hút khi chưa mở chat */}
        {!isOpen && (
          <div
            onClick={toggleChat}
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-[#0A0A0A] text-white text-xs font-semibold rounded-full shadow-xl border border-neutral-700 cursor-pointer hover:border-red-500 transition-all group"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="group-hover:text-red-400 transition-colors">
              Chat chọn size & tư vấn
            </span>
            <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
          </div>
        )}

        {/* Nút bấm tròn Đỏ NewMos (#DC2626) có hiệu ứng pulse thể thao */}
        <button
          type="button"
          onClick={toggleChat}
          aria-label={isOpen ? 'Đóng trợ lý NewMos AI' : 'Mở trợ lý NewMos AI'}
          className={cn(
            'relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl cursor-pointer select-none',
            isOpen
              ? 'bg-[#0A0A0A] hover:bg-neutral-800 text-white shadow-neutral-900/50 rotate-90 scale-95'
              : 'bg-[#DC2626] hover:bg-red-700 text-white shadow-red-600/40 hover:scale-105 active:scale-95'
          )}
        >
          {/* Subtle pulse ring around button when closed */}
          {!isOpen && (
            <span className="absolute -inset-1 rounded-full bg-[#DC2626]/30 animate-pulse pointer-events-none" />
          )}

          {isOpen ? (
            <X className="w-6 h-6 transition-transform" />
          ) : (
            <div className="relative flex items-center justify-center">
              <Bot className="w-7 h-7" />
              <Zap className="w-3 h-3 text-yellow-300 fill-yellow-300 absolute -top-1 -right-1" />
            </div>
          )}
        </button>
      </div>

      {/* 2. CỬA SỔ CHAT (Chat Window) */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[380px] sm:w-[420px] max-w-[calc(100vw-2rem)] h-[580px] max-h-[82vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header màu Đen Thể Thao (#0A0A0A) */}
          <div className="bg-[#0A0A0A] text-white px-4 py-3.5 flex items-center justify-between border-b border-neutral-800 select-none">
            <div className="flex items-center gap-3">
              {/* Bot Avatar */}
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-md shadow-red-600/30">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#0A0A0A] rounded-full"></span>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm tracking-tight text-white">
                    Trợ lý NewMos AI
                  </span>
                  <span className="bg-[#DC2626] text-white text-[9px] font-black uppercase px-1.5 py-0.2 rounded font-mono">
                    PRO
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[11px] text-emerald-400 font-medium">
                    Đang trực tuyến
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-neutral-400">
              {/* Nút Xóa Lịch sử */}
              <button
                type="button"
                onClick={clearMessages}
                title="Làm mới cuộc trò chuyện"
                className="p-1.5 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Nút Đóng / Thu nhỏ */}
              <button
                type="button"
                onClick={closeChat}
                title="Đóng cửa sổ"
                className="p-1.5 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Banner thông báo Ngữ cảnh Sản phẩm (nếu đang xem trên ProductDetail) */}
          {productContext && (
            <div className="bg-red-50/90 border-b border-red-100 px-3.5 py-2 flex items-center justify-between text-xs text-red-900">
              <div className="flex items-center gap-2 overflow-hidden">
                <ShoppingBag className="w-3.5 h-3.5 text-red-600 shrink-0" />
                <span className="truncate">
                  Đang tư vấn:{' '}
                  <strong className="font-bold text-red-700">
                    {productContext.name}
                  </strong>{' '}
                  {productContext.price && (
                    <span className="text-red-500 font-mono">
                      ({formatCurrency(productContext.price)})
                    </span>
                  )}
                </span>
              </div>
              <button
                type="button"
                onClick={clearProductContext}
                title="Bỏ ngữ cảnh"
                className="text-red-400 hover:text-red-700 text-[10px] uppercase font-bold shrink-0 ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Vùng Tin nhắn Cuộc trò chuyện */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/70">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';

              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex flex-col',
                    isUser ? 'items-end' : 'items-start'
                  )}
                >
                  {/* Bong bóng tin nhắn */}
                  <div
                    className={cn(
                      'text-sm leading-relaxed max-w-[88%] break-words',
                      isUser
                        ? 'bg-gradient-to-r from-red-600 via-[#DC2626] to-rose-600 text-white rounded-2xl rounded-tr-xs px-4 py-2.5 shadow-sm font-medium'
                        : 'bg-white text-slate-800 rounded-2xl rounded-tl-xs border border-slate-200/80 px-4 py-3 shadow-xs'
                    )}
                  >
                    {/* Header nhỏ cho Bot */}
                    {!isUser && (
                      <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <Sparkles className="w-3 h-3 text-red-500" />
                        <span>NewMos AI</span>
                      </div>
                    )}

                    {/* Nội dung text của tin nhắn (hỗ trợ xuống dòng) */}
                    <div className="whitespace-pre-line">{msg.text}</div>

                    {/* Badge Size Khuyên Dùng Nổi Bật (Nếu có) */}
                    {msg.recommendedSize && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-red-900">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-red-600 shrink-0" />
                          <div>
                            <span className="text-[10px] uppercase font-bold text-red-500 tracking-wider block">
                              Kích thước tối ưu cho bạn
                            </span>
                            <span className="text-base font-black text-red-600 tracking-tight">
                              SIZE EU {msg.recommendedSize}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-1 rounded-md uppercase font-mono">
                          PERFECT FIT
                        </span>
                      </div>
                    )}

                    {/* Card Sản Phẩm Gợi Ý Trong Tin Nhắn */}
                    {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                      <div className="mt-3 space-y-2 pt-2 border-t border-slate-100">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                          Sản phẩm gợi ý ({msg.suggestedProducts.length}):
                        </span>

                        <div className="space-y-2">
                          {msg.suggestedProducts.map((prod) => (
                            <div
                              key={prod.id || prod.slug}
                              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-2.5 flex items-center gap-3 transition-colors group"
                            >
                              {/* Ảnh sản phẩm */}
                              <img
                                src={prod.imageUrl || '/images/products/placeholder.jpg'}
                                alt={prod.name}
                                onError={(e) => {
                                  // Fallback nếu ảnh bị lỗi
                                  e.target.onerror = null;
                                  e.target.src =
                                    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80';
                                }}
                                className="w-14 h-14 object-cover rounded-lg bg-white border border-slate-200 shrink-0"
                              />

                              {/* Thông tin sản phẩm */}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-red-600 transition-colors">
                                  {prod.name}
                                </h4>
                                <p className="text-xs font-mono font-bold text-red-600 mt-0.5">
                                  {formatCurrency(prod.price)}
                                </p>
                              </div>

                              {/* Nút Xem Chi Tiết */}
                              <button
                                type="button"
                                onClick={() => handleProductClick(prod)}
                                className="px-2.5 py-1.5 bg-[#0A0A0A] hover:bg-red-600 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                              >
                                <span>Xem</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator khi Bot đang trả lời */}
            {isTyping && (
              <div className="flex flex-col items-start">
                <div className="bg-white text-slate-500 rounded-2xl rounded-tl-xs border border-slate-200 px-4 py-3 shadow-xs text-xs flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-bounce"></span>
                    <span
                      className="w-2 h-2 rounded-full bg-red-500 animate-bounce"
                      style={{ animationDelay: '0.15s' }}
                    ></span>
                    <span
                      className="w-2 h-2 rounded-full bg-red-500 animate-bounce"
                      style={{ animationDelay: '0.3s' }}
                    ></span>
                  </div>
                  <span className="italic font-medium text-slate-400">
                    Trợ lý NewMos AI đang trả lời...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts (Chip gợi ý câu hỏi nhanh) */}
          <div className="px-3 py-2 bg-slate-100/90 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              disabled={isTyping}
              onClick={() =>
                handleQuickPrompt(
                  'Tư vấn chọn size chân: chiều dài chân mình 23.5cm, bè mu'
                )
              }
              className="text-[11px] font-semibold text-slate-700 bg-white hover:bg-red-50 hover:text-red-600 border border-slate-200 hover:border-red-300 px-2.5 py-1 rounded-full whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
            >
              <Zap className="w-3 h-3 text-red-500 fill-red-500" />
              <span>⚡ Tư vấn chọn size chân</span>
            </button>

            <button
              type="button"
              disabled={isTyping}
              onClick={() => handleQuickPrompt('Gợi ý mẫu giày chạy bộ hot')}
              className="text-[11px] font-semibold text-slate-700 bg-white hover:bg-red-50 hover:text-red-600 border border-slate-200 hover:border-red-300 px-2.5 py-1 rounded-full whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
            >
              <span>👟 Gợi ý mẫu giày chạy bộ hot</span>
            </button>

            <button
              type="button"
              disabled={isTyping}
              onClick={() => handleQuickPrompt('Cách kiểm tra đơn hàng')}
              className="text-[11px] font-semibold text-slate-700 bg-white hover:bg-red-50 hover:text-red-600 border border-slate-200 hover:border-red-300 px-2.5 py-1 rounded-full whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
            >
              <Package className="w-3 h-3 text-slate-500" />
              <span>📦 Cách kiểm tra đơn hàng</span>
            </button>
          </div>

          {/* Khung nhập tin nhắn mượt mà */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Nhập tin nhắn (vd: chân 23.5cm bè mu chọn size nào?)..."
              disabled={isTyping}
              className="flex-1 text-xs sm:text-sm bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-slate-900 placeholder:text-slate-400 px-3.5 py-2.5 rounded-xl border border-transparent focus:border-red-500 focus:outline-hidden transition-colors"
            />

            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              aria-label="Gửi tin nhắn"
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0',
                !inputMessage.trim() || isTyping
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-[#DC2626] hover:bg-red-700 text-white shadow-md shadow-red-600/30'
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default NewMosChatbot;
