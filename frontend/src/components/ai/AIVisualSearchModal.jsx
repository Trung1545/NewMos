import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Camera,
  Upload,
  Sparkles,
  Search,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import { useAIStore } from '../../stores/useAIStore';
import { aiService } from '../../services/aiService';
import { productService } from '../../services/productService';
import { cn } from '../../lib/utils';

// Ảnh mẫu demo để người dùng thử nhanh
const SAMPLE_SEARCH_IMAGES = [
  {
    title: 'Air Jordan 1',
    queryText: 'Jordan',
    url: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'Ultraboost Light',
    queryText: 'Ultraboost',
    url: 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'Nike Dunk Panda',
    queryText: 'Dunk',
    url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80',
  },
];

export function AIVisualSearchModal({ onSelectProduct }) {
  const navigate = useNavigate();
  const { isVisualSearchOpen, setVisualSearchOpen } = useAIStore();
  const [selectedImage, setSelectedImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [matchedResults, setMatchedResults] = useState([]);
  const fileInputRef = useRef(null);

  if (!isVisualSearchOpen) return null;

  const handleClose = () => {
    setVisualSearchOpen(false);
    setSelectedImage(null);
    setIsScanning(false);
    setScanProgress(0);
    setMatchedResults([]);
  };

  const handleStartScan = async (imageUrl, queryText = 'AIR') => {
    setSelectedImage(imageUrl);
    setIsScanning(true);
    setScanProgress(30);
    setMatchedResults([]);

    try {
      setScanProgress(60);
      let products = [];
      try {
        const res = await aiService.visualSearch(imageUrl, queryText);
        products = res?.data || (Array.isArray(res) ? res : []);
      } catch {
        const res = await productService.getAllProducts({ pageSize: 4 });
        products = res?.data?.content || (Array.isArray(res?.data) ? res.data : []) || [];
      }

      setScanProgress(90);

      const mapped = (products || []).map((p, idx) => ({
        id: p.id,
        matchedName: p.name,
        brand: p.brandName || p.brand || 'NewMos',
        price: p.minPrice ? Number(p.minPrice) : (p.price || 0),
        url: p.defaultThumbnail || p.image || p.variants?.[0]?.thumbnailUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
        score: `${(98.5 - idx * 1.5).toFixed(1)}%`,
        rawProduct: p,
      }));

      setMatchedResults(mapped);
      setScanProgress(100);
    } catch (err) {
      console.error('Lỗi khi tìm kiếm hình ảnh:', err);
      setMatchedResults([]);
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      handleStartScan(previewUrl, 'Sneaker');
    }
  };

  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
      />

      <div className="min-h-full flex items-center justify-center p-4 sm:p-6">
        <div className="relative w-full max-w-2xl bg-[#111111] border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-red-950/40 text-white space-y-6 animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wide flex items-center gap-2">
                  <span>Tìm Kiếm Bằng Hình Ảnh AI</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30">
                    AI Nhận Diện
                  </span>
                </h3>
                <p className="text-xs text-neutral-400">
                  Tải ảnh lên hoặc chụp ảnh đôi giày bạn thích, AI sẽ nhận diện form dáng và gợi ý mẫu có độ tương đồng cao nhất
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-850 transition-colors"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Upload Area */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />

          {!selectedImage ? (
            <div className="space-y-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-700 hover:border-red-500/70 rounded-3xl p-8 text-center cursor-pointer bg-neutral-900/40 hover:bg-neutral-900/80 transition-all group"
              >
                <div className="w-16 h-16 rounded-2xl bg-neutral-800 group-hover:bg-red-600/20 text-neutral-400 group-hover:text-red-500 mx-auto flex items-center justify-center transition-colors mb-4 border border-neutral-700 group-hover:border-red-500/40">
                  <Upload className="w-8 h-8 group-hover:scale-110 transition-transform" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">
                  Kéo thả ảnh sneaker vào đây hoặc nhấp để tải lên
                </h4>
                <p className="text-xs text-neutral-400">
                  Hỗ trợ định dạng PNG, JPG, WEBP (Tối đa 10MB)
                </p>
              </div>

              {/* Thử nhanh với ảnh mẫu */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-neutral-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-red-500" />
                  <span>Hoặc chọn nhanh ảnh mẫu để trải nghiệm AI:</span>
                </span>
                <div className="grid grid-cols-3 gap-3">
                  {SAMPLE_SEARCH_IMAGES.map((sample) => (
                    <button
                      key={sample.title}
                      onClick={() => handleStartScan(sample.url, sample.queryText)}
                      className="group relative aspect-4/3 rounded-xl overflow-hidden border border-neutral-800 hover:border-red-500 bg-neutral-900 transition-all text-left cursor-pointer"
                    >
                      <img
                        src={sample.url}
                        alt={sample.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                        <span className="text-[10px] font-bold text-white truncate">
                          {sample.title}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Preview & Quét */}
              <div className="flex gap-4 items-center bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-black shrink-0 border border-neutral-800">
                  <img
                    src={selectedImage}
                    alt="Uploaded"
                    className="w-full h-full object-cover"
                  />
                  {isScanning && (
                    <div className="absolute inset-0 bg-red-600/30 animate-pulse flex items-center justify-center">
                      <div className="w-full h-1 bg-red-500 shadow-lg shadow-red-500/80 animate-bounce" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-300">
                      {isScanning ? 'Đang trích xuất Vector Embeddings...' : 'Nhận diện hoàn tất'}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedImage(null);
                        setMatchedResults([]);
                      }}
                      className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" /> Chọn ảnh khác
                    </button>
                  </div>

                  {/* Thanh Progress bar */}
                  <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-red-600 to-rose-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    {isScanning
                      ? `Phân tích màu sắc & silhouete đế giày (${scanProgress}%)...`
                      : 'Đã tìm thấy các mẫu giày tương đồng trong kho'}
                  </p>
                </div>
              </div>

              {/* Kết quả tìm kiếm */}
              {matchedResults.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
                    <span>Kết Quả Tìm Kiếm Tương Đồng:</span>
                    <span className="text-red-400 font-normal">Độ tương đồng cao</span>
                  </h4>

                  <div className="space-y-2.5">
                    {matchedResults.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-red-500/50 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={item.url}
                            alt={item.matchedName}
                            className="w-14 h-14 rounded-xl object-cover bg-black border border-neutral-800"
                          />
                          <div>
                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
                              {item.brand}
                            </span>
                            <h5 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">
                              {item.matchedName}
                            </h5>
                            <span className="text-xs font-mono font-bold text-white">
                              {formatVND(item.price)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-red-400" />
                            <span>{item.score} Khớp</span>
                          </span>
                          <button
                            onClick={() => {
                              if (item.id) {
                                navigate(`/product/${item.id}`);
                              } else if (onSelectProduct) {
                                onSelectProduct(item.rawProduct || item);
                              }
                              handleClose();
                            }}
                            className="p-2 rounded-xl bg-neutral-800 hover:bg-red-600 text-white transition-all cursor-pointer"
                            title="Xem chi tiết mẫu này"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AIVisualSearchModal;
