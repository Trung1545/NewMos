import { useAIStore } from '../../stores/useAIStore';
import { SizeGuideModal } from '../size/SizeGuideModal';

export function AISizingModal({ onApplySize = () => {} }) {
  const { isModalOpen, setModalOpen, setRecommendedSize, shoeModel } = useAIStore();

  return (
    <SizeGuideModal
      isOpen={isModalOpen}
      onClose={() => setModalOpen(false)}
      onApplySize={(size) => {
        setRecommendedSize(size);
        if (onApplySize) onApplySize(size);
      }}
      shoeModel={shoeModel || 'RUNNER_PRO'}
      shoeName="NewMos Runner Pro"
    />
  );
}

export const AIFitModal = AISizingModal;
export default AISizingModal;
