import { type EmbyItemMetadata, formatEpisodeCode } from "@shared";
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
      withCloseButton={true}
      classNames={{
        content: styles.modalContent,
      }}
    >
      {episode && (
        <div className={styles.modalBody}>
          <div className={styles.modalHeader}>
            <div className={styles.modalHeaderInfo}>
              <div className={styles.modalEpisodeCode}>{formatEpisodeCode(episode.ParentIndexNumber, episode.IndexNumber)}</div>
              <h3 className={styles.modalEpisodeTitle}>{episode.Name || "Episode"}</h3>
            </div>
          </div>

          <div className={styles.modalOverviewScroll}>
            <p className={styles.modalOverviewText}>{episode.Overview || "No overview available for this episode."}</p>
          </div>
        </div>
      )}
    </Modal>
  );
}
