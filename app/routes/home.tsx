import { Button, Container, Group, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { IconArrowRight, IconServer } from "@tabler/icons-react";
import { useNavigate } from "react-router";
import { ContinueWatching } from "../components/ContinueWatching";
import { LibraryShelf } from "../components/LibraryShelf";
import { useIINABridge } from "../hooks/useIINABridge";
import { useLibrarySections } from "../hooks/useLibrarySections";

export function meta() {
  return [{ title: "Home - IINA Emby" }, { name: "description", content: "Emby Media Browser" }];
}

export default function HomeRoute() {
  const navigate = useNavigate();
  const { activeServer, servers, playMedia } = useIINABridge();
  const { sections, isLoading: isLoadingSections } = useLibrarySections(activeServer);

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
      <Stack gap="xl">
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

        {/* 1. Continue Watching shelf (16:9 landscape previews with progress) */}
        <ContinueWatching server={activeServer} onPlayMedia={playMedia} />

        {/* 2. Library shelves (Movies, TV shows, etc.) with 2:3 vertical posters */}
        {sections.map(({ view, items }) => (
          <LibraryShelf
            key={view.Id}
            view={view}
            items={items}
            server={activeServer}
          />
        ))}
      </Stack>
    </Container>
  );
}
