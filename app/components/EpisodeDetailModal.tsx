import { type EmbyItemMetadata, formatEpisodeCode } from "@shared";
import { IconX } from "@tabler/icons-react";
import styles from "./EpisodeDetailModal.module.css";
import { Modal } from "./ui/Modal";

export interface EpisodeDetailModalProps {
  episode: EmbyItemMetadata | null;
  onClose: () => void;
}

export function EpisodeDetailModal({ episode, onClose }: EpisodeDetailModalProps) {
  return (
    <Modal
      opened={Boolean(episode)}
      onClose={onClose}
      size="28rem"
      classNames={{
        content: styles.modalContent,
        overlay: styles.modalOverlay,
      }}
    >
      {episode && (
        <div className={styles.modalBody}>
          <div className={styles.modalHeader}>
            <div className={styles.modalHeaderInfo}>
              <div className={styles.modalEpisodeCode}>{formatEpisodeCode(episode.ParentIndexNumber, episode.IndexNumber)}</div>
              <h3 className={styles.modalEpisodeTitle}>{episode.Name || "Episode"}</h3>
            </div>

            <button type="button" className={styles.modalCloseButton} onClick={onClose} aria-label="Close" title="Close">
              <IconX size={16} />
            </button>
          </div>

          <div className={styles.modalOverviewScroll}>
            <p className={styles.modalOverviewText}>{episode.Overview || "No overview available for this episode."}</p>
          </div>
        </div>
      )}
    </Modal>
  );
}
