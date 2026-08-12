import { PrismaClient } from '../src/generated/prisma/index.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Verifica se já existe empresa
  const existing = await prisma.company.findFirst();
  if (existing) {
    console.log('⚠️  Já existe uma empresa cadastrada. Seed ignorado.');
    return;
  }

  // Cria a empresa
  const company = await prisma.company.create({
    data: { name: 'Catavento Espaço Pedagógico' }
  });
  console.log('✅ Empresa criada:', company.name);

  // Cria o usuário admin
  const hash = await bcrypt.hash('123456', 10);
  await prisma.user.create({
    data: {
      name: 'Administrador',
      email: 'admin@empresa.com',
      password: hash,
      companyId: company.id
    }
  });
  console.log('✅ Usuário admin criado');

  // Categorias de entrada
  const entradas = [
    ['Mensalidades', '💳', '#1E7A62'],
    ['Vendas', '💰', '#2B5D9B'],
    ['Serviços', '🛠️', '#8A4FBF'],
    ['Produtos digitais', '🖥️', '#0F7D8C'],
    ['Outros recebimentos', '🏷️', '#5B6B7C']
  ];

  // Categorias de saída
  const saidas = [
    ['Aluguel', '🏠', '#B4483F'],
    ['Internet', '🌐', '#2B5D9B'],
    ['Marketing', '📣', '#8A4FBF'],
    ['Impostos', '🏛️', '#9C6F16'],
    ['Contabilidade', '📊', '#0F7D8C'],
    ['Materiais', '📦', '#C2557E'],
    ['Ferramentas e sistemas', '🧰', '#5B6B7C'],
    ['Salários e retiradas', '👤', '#4A7A2B'],
    ['Transporte', '🚗', '#A0522D'],
    ['Manutenção', '🔧', '#1E7A62'],
    ['Contas de consumo', '💡', '#B4483F'],
    ['Outras despesas', '🏷️', '#7A8797']
  ];

  for (const [name, icon, color] of entradas) {
    await prisma.category.create({
      data: { name, type: 'entrada', icon, color, companyId: company.id }
    });
  }

  for (const [name, icon, color] of saidas) {
    await prisma.category.create({
      data: { name, type: 'saida', icon, color, companyId: company.id }
    });
  }

  console.log('✅ Categorias criadas');
  console.log('');
  console.log('========================================');
  console.log('  📧 Login: admin@empresa.com');
  console.log('  🔑 Senha: 123456');
  console.log('========================================');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
