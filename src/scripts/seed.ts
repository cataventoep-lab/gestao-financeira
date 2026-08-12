import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.create({
    data: {
      name: "Minha Empresa Demo",
    },
  });

  const passwordHash = await bcrypt.hash("123456", 10);

  const user = await prisma.user.create({
    data: {
      name: "Administrador",
      email: "admin@empresa.com",
      password: passwordHash,
      companyId: company.id,
    },
  });

  console.log("Demo user created:");
  console.log("Email: admin@empresa.com");
  console.log("Senha: 123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
