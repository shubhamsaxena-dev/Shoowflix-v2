import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' })
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' })
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    })

    // Return user without password
    const { password: _, ...userWithoutPassword } = user
    res.status(201).json({ 
      message: 'User created successfully',
      user: userWithoutPassword 
    })

  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}