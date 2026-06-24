import type { Request, Response } from "express";
import { UserRepository } from "../auth/user.repository.js";
export const AdminController = {
  getAllUsers: async (req: Request, res: Response): Promise<void> => {
    const users = await UserRepository.getAllUsers();
    res.status(200).json({ success: true, message: "Users fetched", data: users });
  },
  updateUserRole: async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { role } = req.body;
    const user = await UserRepository.updateUser(id, { role });
    res.status(200).json({ success: true, message: "User role updated", data: user });
  },
  updateUserStatus: async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body;
    const user = await UserRepository.updateUser(id, { status });
    res.status(200).json({ success: true, message: "User status updated", data: user });
  }
};
