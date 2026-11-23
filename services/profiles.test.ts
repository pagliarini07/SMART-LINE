jest.mock("./supabase", () => ({
  supabase: { auth: { updateUser: jest.fn() } },
}));

import { supabase } from "./supabase";
import { atualizarEmailLogin } from "./profiles";

const mockUpdateUser = supabase.auth.updateUser as jest.Mock;

beforeEach(() => {
  mockUpdateUser.mockReset();
});

describe("atualizarEmailLogin", () => {
  it("pede ao Supabase Auth pra trocar o e-mail de login", async () => {
    mockUpdateUser.mockResolvedValueOnce({ data: {}, error: null });

    await atualizarEmailLogin("novo@example.com");

    expect(mockUpdateUser).toHaveBeenCalledWith({
      email: "novo@example.com",
    });
  });

  it("propaga o erro quando o Supabase Auth recusa a troca", async () => {
    mockUpdateUser.mockResolvedValueOnce({
      data: null,
      error: { message: "User already registered" },
    });

    await expect(atualizarEmailLogin("ocupado@example.com")).rejects.toEqual(
      { message: "User already registered" }
    );
  });
});
