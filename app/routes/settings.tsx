import { useNavigate } from "react-router";
import { PageHeader } from "~/components/PageHeader";
import { Button } from "~/components/ui/Button";
import styles from "./settings.module.css";

export function meta() {
  return [{ title: "Settings - IINA Emby" }];
}

export default function SettingsRoute() {
  const navigate = useNavigate();

  const onBack = () => {
    navigate("/");
  };

  const onSystemInfo = () => {
    navigate("/system-info");
  };

  return (
    <>
      <PageHeader onBack={onBack} backTitle="Back" className={styles.pageHeader} title="Settings" />

      <div className={styles.container}>
        <Button onClick={onSystemInfo}>System Info</Button>
      </div>
    </>
  );
}
