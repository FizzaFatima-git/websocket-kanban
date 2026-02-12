// src/tests/integration/WebSocketIntegration.test.jsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import KanbanBoard from "../../components/KanbanBoard";
import { vi } from "vitest";

// Mock Socket.IO
const mockSocket = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
};

describe("KanbanBoard Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    render(<KanbanBoard socketInstance={mockSocket} />);
  });

  test("can add a task and socket emits", async () => {
    fireEvent.change(screen.getByPlaceholderText("Task title"), {
      target: { value: "Integration Task" },
    });
    fireEvent.click(screen.getByText("Add Task"));

    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith(
        "add-task",
        expect.objectContaining({ text: "Integration Task" })
      );
    });
  });

  test("dropdowns update correctly", () => {
    fireEvent.change(screen.getByDisplayValue("Low"), { target: { value: "High" } });
    fireEvent.change(screen.getByDisplayValue("Feature"), { target: { value: "Bug" } });

    expect(screen.getByDisplayValue("High")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Bug")).toBeInTheDocument();
  });

  test("file input works", () => {
    const file = new File(["dummy content"], "sample.png", { type: "image/png" });
    const input = screen.getByTestId("file-input");
    fireEvent.change(input, { target: { files: [file] } });

    expect(input.files[0]).toStrictEqual(file);
    expect(input.files).toHaveLength(1);
  });
});
