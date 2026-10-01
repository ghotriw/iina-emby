import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import type { EmbyServer } from "@shared";
import { IconAlertCircle, IconCheck, IconPlus, IconServer, IconTrash } from "@tabler/icons-react";
import type React from "react";
import { useState } from "react";
import { useIINABridge } from "../hooks/useIINABridge";
import { authenticateByName } from "../lib/emby-auth-client";
import { ConfirmModal } from "./ConfirmModal";

interface ServerManagementProps {
  onServerSelected?: (serverId: string) => void;
}

export function ServerManagement({ onServerSelected }: ServerManagementProps) {
  const { servers, activeServerId, selectServer, removeServer, saveServer } = useIINABridge();

  const [serverToDelete, setServerToDelete] = useState<EmbyServer | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const showForm = isAdding || servers.length === 0;
  const [serverUrl, setServerUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!serverUrl || !username) {
      setError("Server URL and username are required");
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await authenticateByName(serverUrl, username, password);

    setIsLoading(false);

    if (result.success && result.server) {
      saveServer(result.server);
      setIsAdding(false);
      setPassword("");
      if (onServerSelected) {
        onServerSelected(result.server.id);
      }
    } else {
      setError(result.error || "Connection failed");
    }
  };

  const handleSelect = (serverId: string) => {
    selectServer(serverId);
    if (onServerSelected) {
      onServerSelected(serverId);
    }
  };

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={2} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <IconServer size={28} />
            Emby Servers
          </Title>
          <Text c="dimmed" size="sm">
            Select a connected Emby server or add a new one.
          </Text>
        </div>

        {servers.length > 0 && (
          <Stack gap="xs">
            <Text fw={500} size="sm">
              Saved Servers
            </Text>
            {servers.map((server) => {
              const isActive = server.id === activeServerId;
              return (
                <Card
                  key={server.id}
                  padding="md"
                  radius="md"
                  withBorder
                  style={{
                    cursor: "pointer",
                    borderColor: isActive ? "var(--mantine-color-teal-6)" : undefined,
                    backgroundColor: isActive ? "rgba(18, 184, 134, 0.08)" : undefined,
                    transition: "all 0.15s ease",
                  }}
                  onClick={() => handleSelect(server.id)}
                >
                  <Group justify="space-between" wrap="nowrap">
                    <Stack gap={2} style={{ overflow: "hidden" }}>
                      <Group gap="xs">
                        <Text fw={600} truncate>
                          {server.serverName || "Emby Server"}
                        </Text>
                        {isActive && (
                          <Badge color="teal" size="sm" variant="light">
                            Active
                          </Badge>
                        )}
                      </Group>
                      <Text size="xs" c="dimmed" truncate>
                        {server.serverUrl}
                      </Text>
                      {server.username && (
                        <Text size="xs" c="dimmed">
                          User:{" "}
                          <Text span fw={500}>
                            {server.username}
                          </Text>
                        </Text>
                      )}
                    </Stack>

                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={(e) => {
                          e.stopPropagation();
                          setServerToDelete(server);
                        }}
                        title="Remove server"
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Group>
                </Card>
              );
            })}
          </Stack>
        )}

        {!showForm && (
          <Button variant="light" leftSection={<IconPlus size={16} />} onClick={() => setIsAdding(true)}>
            Add Another Server
          </Button>
        )}

        {showForm && (
          <Paper withBorder p="lg" radius="md">
            <form onSubmit={handleConnect}>
              <Stack gap="md">
                <Group justify="space-between">
                  <Title order={4}>Add Emby Server</Title>
                  {servers.length > 0 && (
                    <Button variant="subtle" size="xs" onClick={() => setIsAdding(false)}>
                      Cancel
                    </Button>
                  )}
                </Group>

                {error && (
                  <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red" variant="light">
                    {error}
                  </Alert>
                )}

                <TextInput
                  label="Server URL"
                  placeholder="http://myserver:8096"
                  description="Address of your Emby server (port 8096 by default)"
                  required
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.currentTarget.value)}
                  disabled={isLoading}
                />

                <TextInput
                  label="Username"
                  placeholder="Your username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.currentTarget.value)}
                  disabled={isLoading}
                />

                <PasswordInput
                  label="Password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.currentTarget.value)}
                  disabled={isLoading}
                />

                <Button type="submit" fullWidth loading={isLoading} leftSection={!isLoading ? <IconCheck size={18} /> : undefined}>
                  Connect & Sign In
                </Button>
              </Stack>
            </form>
          </Paper>
        )}
      </Stack>

      <ConfirmModal
        opened={serverToDelete !== null}
        onClose={() => setServerToDelete(null)}
        onConfirm={() => {
          if (serverToDelete) {
            removeServer(serverToDelete.id);
            setServerToDelete(null);
          }
        }}
        title="Remove Server"
        message={
          <>
            Are you sure you want to remove{" "}
            <Text span fw={600} c="var(--mantine-color-text)">
              {serverToDelete?.serverName || "this server"}
            </Text>
            ? You will need to sign in again to reconnect.
          </>
        }
        confirmLabel="Remove"
        confirmColor="red"
      />
    </Container>
  );
}
