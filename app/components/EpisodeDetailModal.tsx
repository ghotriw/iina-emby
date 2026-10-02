import type { EmbyItemMetadata } from "@shared";
import { IconX } from "@tabler/icons-react";
import { Modal } from "./Modal";
import styles from "./EpisodeDetailModal.module.css";

export interface EpisodeDetailModalProps {
  episode: EmbyItemMetadata | null;
  onClose: () => void;
}

export function EpisodeDetailModal({ episode, onClose }: EpisodeDetailModalProps) {
  return (
    <Modal
      opened={Boolean(episode)}
      onClose={onClose}
      centered
      size="28rem"
      withCloseButton={false}
      classNames={{
        content: styles.modalContent,
        overlay: styles.modalOverlay,
      }}
    >
      {episode && (
        <div className={styles.modalBody}>
          <div className={styles.modalHeader}>
            <div className={styles.modalHeaderInfo}>
              <div className={styles.modalEpisodeCode}>
                S{String(episode.ParentIndexNumber ?? 1).padStart(2, "0")} · E
                {String(episode.IndexNumber ?? 1).padStart(2, "0")}
              </div>
              <h3 className={styles.modalEpisodeTitle}>{episode.Name || "Episode"}</h3>
            </div>

            <button
              type="button"
              className={styles.modalCloseButton}
              onClick={onClose}
              aria-label="Close"
              title="Close"
            >
              <IconX size={16} />
            </button>
          </div>

          <div className={styles.modalOverviewScroll}>
            <p className={styles.modalOverviewText}>
              {episode.Overview || "No overview available for this episode."}
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}
