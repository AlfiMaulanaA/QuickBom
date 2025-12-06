import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// GET /api/users/[id] - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        phone: true,
        employeeId: true,
        department: true,
        position: true,
        hireDate: true,
        salary: true,
        lastLogin: true,
        isEmailVerified: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      email,
      name,
      role,
      status,
      phone,
      employeeId,
      department,
      position,
      hireDate,
      salary,
      password,
    } = body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        employeeId: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if email is already taken by another user
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: "Email already taken by another user" },
          { status: 400 }
        );
      }
    }

    // Check if employeeId is already taken by another user
    if (employeeId && employeeId !== existingUser.employeeId) {
      const employeeIdExists = await prisma.user.findUnique({
        where: { employeeId },
      });

      if (employeeIdExists) {
        return NextResponse.json(
          { error: "Employee ID already taken by another user" },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      email,
      name,
      role,
      status,
      phone,
      employeeId,
      department,
      position,
      hireDate: hireDate ? new Date(hireDate) : null,
      salary: salary ? parseFloat(salary) : null,
    };

    // Only hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        phone: true,
        employeeId: true,
        department: true,
        position: true,
        hireDate: true,
        salary: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has any assigned tasks or created projects
    const userProjects = await prisma.project.count({
      where: { createdBy: params.id },
    });

    const userTasks = await prisma.projectTask.count({
      where: {
        assignedUsers: {
          some: { id: params.id }
        }
      },
    });

    if (userProjects > 0 || userTasks > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete user with existing projects or assigned tasks. Please reassign or delete related records first."
        },
        { status: 400 }
      );
    }

    // Delete user
    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
