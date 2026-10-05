import { describe, expect, it } from "vitest";
import {
  formatDuration,
  formatEpisodeCode,
  formatEpisodeSubtitle,
  formatFullEpisodeTitle,
  formatTimeProgress,
  secondsToTicks,
  TICKS_PER_SECOND,
  ticksToSeconds,
} from "./time";

describe("time utils", () => {
  describe("ticks <-> seconds conversion", () => {
    it("converts ticks to seconds correctly", () => {
      expect(ticksToSeconds(10_000_000)).toBe(1);
      expect(ticksToSeconds(600_000_000)).toBe(60);
      expect(ticksToSeconds(0)).toBe(0);
      expect(ticksToSeconds(null)).toBe(0);
      expect(ticksToSeconds(undefined)).toBe(0);
      expect(ticksToSeconds(-100)).toBe(0);
    });

    it("converts seconds to ticks correctly", () => {
      expect(secondsToTicks(1)).toBe(TICKS_PER_SECOND);
      expect(secondsToTicks(60)).toBe(60 * TICKS_PER_SECOND);
      expect(secondsToTicks(0)).toBe(0);
      expect(secondsToTicks(null)).toBe(0);
      expect(secondsToTicks(-5)).toBe(0);
    });
  });

  describe("formatDuration", () => {
    it("formats zero and negative durations", () => {
      expect(formatDuration(0)).toBe("0:00");
      expect(formatDuration(-10)).toBe("0:00");
      expect(formatDuration(null)).toBe("0:00");
    });

    it("formats minutes and seconds (< 1 hour)", () => {
      expect(formatDuration(5)).toBe("0:05");
      expect(formatDuration(65)).toBe("1:05");
      expect(formatDuration(599)).toBe("9:59");
    });

    it("formats hours, minutes, and seconds (>= 1 hour)", () => {
      expect(formatDuration(3600)).toBe("1:00:00");
      expect(formatDuration(3665)).toBe("1:01:05");
      expect(formatDuration(7325)).toBe("2:02:05");
    });
  });

  describe("formatTimeProgress", () => {
    it("formats current and total time", () => {
      expect(formatTimeProgress(120, 3600)).toBe("2:00 / 1:00:00");
      expect(formatTimeProgress(null, null)).toBe("0:00 / 0:00");
    });
  });

  describe("episode formatting", () => {
    it("formats episode code SxxExx", () => {
      expect(formatEpisodeCode(1, 1)).toBe("S01E01");
      expect(formatEpisodeCode(2, 12)).toBe("S02E12");
      expect(formatEpisodeCode(null, null)).toBe("S01E01");
    });

    it("formats full episode title", () => {
      expect(formatFullEpisodeTitle("Breaking Bad", 1, 1, "Pilot")).toBe("Breaking Bad S01E01 - Pilot");
      expect(formatFullEpisodeTitle(null, 2, 5, "Hero")).toBe("S02E05 - Hero");
    });

    it("formats episode subtitle", () => {
      expect(formatEpisodeSubtitle(1, 2, "Chapter Two")).toBe("S01 - E02 - Chapter Two");
      expect(formatEpisodeSubtitle(null, null, "Only Name")).toBe("Only Name");
    });
  });
});
