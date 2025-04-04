# ✅ TODO - Joyce Cakes App

## 🔹 Configuração Inicial
- [x] Estruturar pastas do projeto (`models`, `controllers`, `views`, `config`)
- [x] Criar conexão com **MySQL** (`config/db.py`)
- [x] Criar estrutura do banco de dados e a **tabela `produtos`**

## 🔹 Backend - Gerenciamento de Produtos
### 📌 Classes
- [x] Criar classe `Produto` (`models/produto.py`)
  - `__init__(self, id, nome, descricao, preco, quantidade, tipo)`
  - `salvar(self)`
  - `deletar(produto_id)` (método estático)
  - `listar_todos()` (método estático)
  - `buscar_por_id(produto_id)` (método estático)

- [x] Criar `ProdutoController` (`controllers/produto_controller.py`)
  - `cadastrar_produto(nome, descricao, preco, quantidade, tipo)` (método estático)
  - `deletar_produto(produto_id)` (método estático)
  - `listar_produtos()` (método estático)
  - `editar_produto(produto_id, novos_dados)` (método estático)

## 🔹 Interface Gráfica (Flet)
### 📌 Telas
- [x] Criar tela de **cadastro de produtos** (`views/cadastro_produto.py`)
- [x] Ajustar código para **remover o uso de `UserControl`** no Flet
- [x] Criar tela de **listagem de produtos** (`views/lista_produtos.py`)
- [ ] Criar tela de **edição de produtos**
- [ ] Criar tela de **exclusão de produtos**
- [ ] Adicionar mensagens de erro e sucesso na interface

## 🔹 Funcionalidades Extras
- [ ] Criar sistema de **autenticação de usuário** (login e senha)
- [ ] Criar sistema de **notificação de estoque baixo**
- [ ] Melhorar experiência do usuário (design, botões, cores)
- [ ] Criar **documentação** do projeto (`README.md`, `Wiki`, `docs/`)
- [ ] Criar **Testes** para validar funcionalidades

### 🚀 **Próximo Passo:**
- [ ] Criar a tela de **edição de produtos** para que os usuários possam modificar produtos já cadastrados.
