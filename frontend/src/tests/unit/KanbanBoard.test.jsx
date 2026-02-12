// src/tests/unit/KanbanBoard.test.jsx
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

describe("KanbanBoard Unit & Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    render(<KanbanBoard socketInstance={mockSocket} />);
  });

  test("renders task form correctly", () => {
    expect(screen.getByPlaceholderText("Task title")).toBeInTheDocument();
    expect(screen.getByText("Add Task")).toBeInTheDocument();
  });

  test("can add a task", async () => {
    fireEvent.change(screen.getByPlaceholderText("Task title"), {
      target: { value: "Test Task" },
    });
    fireEvent.click(screen.getByText("Add Task"));

    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith(
        "add-task",
        expect.objectContaining({ text: "Test Task" })
      );
    });

    expect(screen.getByPlaceholderText("Task title").value).toBe(""); // cleared
  });

  test("priority & category dropdowns work", () => {
    fireEvent.change(screen.getByDisplayValue("Low"), { target: { value: "High" } });
    fireEvent.change(screen.getByDisplayValue("Feature"), { target: { value: "Bug" } });

    expect(screen.getByDisplayValue("High")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Bug")).toBeInTheDocument();
  });

  test("file input sets file state", () => {
    const file = new File(["dummy content"], "sample.png", { type: "image/png" });
    const input = screen.getByTestId("file-input");
    fireEvent.change(input, { target: { files: [file] } });

    expect(input.files[0]).toStrictEqual(file);
    expect(input.files).toHaveLength(1);
  });
});

