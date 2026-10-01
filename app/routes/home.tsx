import { Badge, Button, Card, Code, Container, Group, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { IconArrowRight, IconMovie, IconServer } from "@tabler/icons-react";
import { useNavigate } from "react-router";
import { ContinueWatching } from "../components/ContinueWatching";
import { useIINABridge } from "../hooks/useIINABridge";

export function meta() {
  return [{ title: "Home - IINA Emby" }, { name: "description", content: "Emby Media Browser" }];
}

export default function HomeRoute() {
  const navigate = useNavigate();
  const { activeServer, servers, playMedia } = useIINABridge();

  if (servers.length === 0 || !activeServer) {
    return (
      <Container size="sm" py="xl">
        <Stack align="center" gap="md" ta="center">
          <ThemeIcon size={64} radius="xl" color="teal" variant="light">
            <IconServer size={36} />
          </ThemeIcon>
          <Title order={2}>No Emby Server Connected</Title>
          <Text c="dimmed" size="sm" maw={400}>
            To start browsing movies and series, connect your Emby server first.
          </Text>
          <Button size="md" rightSection={<IconArrowRight size={18} />} onClick={() => navigate("/servers")}>
            Connect Server
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <div>
            <Title order={2}>{activeServer.serverName || "Emby Server"}</Title>
            <Text c="dimmed" size="sm">
              Logged in as{" "}
              <Text span fw={600}>
                {activeServer.username}
              </Text>
            </Text>
          </div>
          <Button variant="light" size="xs" leftSection={<IconServer size={14} />} onClick={() => navigate("/servers")}>
            Switch Server
          </Button>
        </Group>

        <Card withBorder p="xl" radius="md">
          <Stack align="center" gap="xs" py="md">
            <ThemeIcon size={48} radius="xl" color="teal" variant="light">
              <IconMovie size={28} />
            </ThemeIcon>
            <Title order={3}>Server Connected!</Title>
            <Text c="dimmed" size="sm" ta="center" maw={460}>
              Server URL: <Code>{activeServer.serverUrl}</Code>
            </Text>
            <Badge color="teal" variant="dot">
              Ready for Media Browser
            </Badge>
          </Stack>
        </Card>

        <ContinueWatching server={activeServer} onPlayMedia={playMedia} />
      </Stack>
    </Container>
  );
}
