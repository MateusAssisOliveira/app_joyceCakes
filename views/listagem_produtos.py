import flet as ft
from typing import List, Optional
from controllers.produto_controller import ProdutoController
from config.logger_config import ConfigurarLogger
from models.produto import Produto
import os
import platform
from datetime import datetime

class ListagemProdutos:
    """
    Componente de listagem de produtos com funcionalidades de seleção e exibição.
    """
    
    def __init__(self, page: ft.Page):
        """Inicializa o componente de listagem de produtos."""
        self.page = page
        self.logger = ConfigurarLogger.configurar("ListagemProdutos", log_em_arquivo=True)
        
        # Estado interno
        self._produto_ativo: Optional[int] = None
        self.selecionados: List[bool] = []
        
        # Configuração da tabela
        self.tabela = ft.DataTable(
            columns=[
                ft.DataColumn(ft.Text("ID", weight=ft.FontWeight.BOLD)),
                ft.DataColumn(ft.Text("Nome", weight=ft.FontWeight.BOLD)),
                ft.DataColumn(ft.Text("Descrição", weight=ft.FontWeight.BOLD)),
                ft.DataColumn(ft.Text("Preço", weight=ft.FontWeight.BOLD)),
                ft.DataColumn(ft.Text("Quantidade", weight=ft.FontWeight.BOLD)),
                ft.DataColumn(ft.Text("Tipo", weight=ft.FontWeight.BOLD)),
            ],
            rows=[],
            heading_row_height=40,
            horizontal_margin=12,
            column_spacing=20,
        )
        
        # Container principal
        self.container = ft.Container(
            content=ft.Column(
                controls=[
                    ft.Text("Lista de Produtos", size=20, weight=ft.FontWeight.BOLD, 
                            text_align=ft.TextAlign.CENTER),
                    ft.Container(
                        content=self.tabela,
                        padding=ft.padding.symmetric(vertical=10),
                        border=ft.border.all(1, ft.colors.OUTLINE),
                        border_radius=8,
                    ),
                    ft.ElevatedButton(
                        "Limpar Terminal",
                        on_click=lambda _: self.limpar_terminal(),
                        icon=ft.icons.CLEAR
                    )
                ],
                expand=True
            ),
            expand=True
        )
        
        # Carrega os produtos
        self.carregar_produtos()

    @property
    def content(self):
        """Retorna o conteúdo para adicionar à página."""
        return self.container

    def limpar_terminal(self):
        """Limpa o terminal de forma compatível com Windows/Linux/Mac"""
        try:
            if platform.system() == "Windows":
                os.system('cls')
            else:
                os.system('clear')
            print("=== SISTEMA DE PRODUTOS ===")
            print(f"Debug: {datetime.now().strftime('%H:%M:%S')}\n")
            self.log_info("Terminal limpo com sucesso")
        except Exception as e:
            self.log_error("Falha ao limpar terminal", e)

    def log_info(self, mensagem: str) -> None:
        """Registra uma mensagem informativa no log."""
        mensagem_formatada = f"[INFO] {mensagem}"
        self.logger.info(mensagem_formatada)
        print(mensagem_formatada)

    def log_error(self, mensagem: str, exception: Optional[Exception] = None) -> None:
        """Registra uma mensagem de erro no log."""
        error_msg = f"[ERRO] {mensagem}"
        if exception:
            error_msg += f" | Tipo: {type(exception).__name__} | Detalhes: {str(exception)}"
        self.logger.error(error_msg, exc_info=True)
        print(error_msg)

    def criar_celula(self, texto: str, index: Optional[int] = None) -> ft.DataCell:
        """Cria uma célula da tabela com formatação condicional."""
        try:
            # Inicializa com False por padrão
            esta_selecionado = False
            
            # Determina se está selecionado com verificação de limites
            if index is not None:
                if index < len(self.selecionados):
                    esta_selecionado = self.selecionados[index]
                    self.log_info(f"Estado de seleção (índice {index}): {esta_selecionado}")
                else:
                    self.log_error(f"Índice {index} fora do range (tamanho: {len(self.selecionados)})")
            else:
                self.log_info("Nenhum índice fornecido - célula normal")

            return ft.DataCell(
                ft.Text(
                    str(texto),
                    weight=ft.FontWeight.BOLD if esta_selecionado else ft.FontWeight.NORMAL,
                    color=ft.colors.RED if esta_selecionado else None,
                    size=12
                )
            )

        except Exception as e:
            error_msg = f"ERRO ao criar célula. Texto: {texto} | Índice: {index}"
            self.log_error(error_msg, e)
            return ft.DataCell(ft.Text("ERRO", color=ft.colors.RED))

    def toggle_selection(self, index: int) -> callable:
        """Alterna o estado de seleção de um produto."""
        def handler(e):
            try:
                self.log_info(f"\n--- INÍCIO DA SELEÇÃO (Índice: {index}) ---")
                self.log_info(f"Estado ANTES da alteração: {self.selecionados}")

                # Verificação de limites
                if not (0 <= index < len(self.selecionados)):
                    self.log_error(f"Índice {index} fora dos limites (0-{len(self.selecionados)-1})")
                    return

                # Alterna o estado do item clicado
                novo_estado = not self.selecionados[index]
                self.selecionados[index] = novo_estado
                
                # Garante seleção única
                if novo_estado:
                    for i in range(len(self.selecionados)):
                        if i != index and self.selecionados[i]:
                            self.selecionados[i] = False

                # Atualiza produto ativo
                self._produto_ativo = index if novo_estado else None
                self.log_info(f"Estado DEPOIS da alteração: {self.selecionados}")

                # Reconstroi todas as linhas para garantir consistência
                produtos = ProdutoController.listar_produtos()
                self.tabela.rows = [
                    self.criar_linha_produto(produto, i)
                    for i, produto in enumerate(produtos)
                ]
                
                self.page.update()
                self.log_info("--- FIM DA SELEÇÃO ---")

            except Exception as ex:
                error_msg = f"FALHA NA SELEÇÃO - Índice: {index} | Erro: {str(ex)}"
                self.log_error(error_msg, ex)
                raise

        return handler

    def criar_linha_produto(self, produto: Produto, index: int) -> ft.DataRow:
        """Cria uma linha da tabela para um produto específico."""
        return ft.DataRow(
            cells=[
                self.criar_celula(produto.id, index),
                self.criar_celula(produto.nome, index),
                self.criar_celula(produto.descricao, index),
                self.criar_celula(f"R$ {produto.preco:.2f}", index),
                self.criar_celula(produto.quantidade, index),
                self.criar_celula(produto.tipo, index),
            ],
            on_select_changed=self.toggle_selection(index),
            selected=self.selecionados[index],
        )

    def mostrar_mensagem_na_tabela(self, mensagem: str) -> None:
        """Exibe uma mensagem na tabela quando não há produtos ou ocorre um erro."""
        self.tabela.rows = [
            ft.DataRow(
                cells=[ft.DataCell(ft.Text(mensagem, text_align=ft.TextAlign.CENTER, col=6))]
            )
        ]
        self.page.update()

    def carregar_produtos(self, produtos: Optional[List[Produto]] = None) -> None:
        """Carrega os produtos na tabela."""
        self.log_info("Iniciando carregamento de produtos...")
        self.tabela.rows = []

        try:
            produtos = produtos or ProdutoController.listar_produtos()
            
            # Mantém a seleção atual se possível
            old_selected = self._produto_ativo
            self.selecionados = [False] * len(produtos) if produtos else []
            
            if old_selected and produtos:
                try:
                    idx = next(i for i, p in enumerate(produtos) if p.id == old_selected)
                    self.selecionados[idx] = True
                except StopIteration:
                    self._produto_ativo = None
            
            if not produtos:
                self.log_info("Nenhum produto encontrado.")
                self.mostrar_mensagem_na_tabela("Nenhum produto cadastrado.")
                return

            self.tabela.rows = [
                self.criar_linha_produto(produto, index)
                for index, produto in enumerate(produtos)
            ]
            self.log_info(f"Carregados {len(produtos)} produtos com sucesso.")
        except Exception as e:
            self.log_error("Falha ao carregar produtos", e)
            self.mostrar_mensagem_na_tabela("Erro ao carregar produtos")
        finally:
            self.page.update()

    def atualizar_tabela(self, produtos: Optional[List[Produto]] = None) -> None:
        """Atualiza a tabela com os produtos fornecidos ou busca novos."""
        self.carregar_produtos(produtos)

    def selecionar_produto(self, produto: Produto) -> None:
        """Seleciona um produto específico na tabela."""
        if produto:
            self.log_info(f"Selecionando produto: ID={produto.id}, Nome={produto.nome}")
            produtos = ProdutoController.listar_produtos()
            try:
                index = next(i for i, p in enumerate(produtos) if p.id == produto.id)
                self.selecionados = [False] * len(produtos)
                self.selecionados[index] = True
                self._produto_ativo = produto.id
                self.atualizar_tabela(produtos)
            except StopIteration:
                self.log_error(f"Produto ID {produto.id} não encontrado na lista")

    def obter_produto_selecionado(self) -> Optional[int]:
        """Retorna o ID do produto atualmente selecionado."""
        return self._produto_ativo

    def verificar_estado(self):
        """Método para debug do estado atual."""
        print("\n=== ESTADO ATUAL ===")
        print(f"Produto ativo: {self._produto_ativo}")
        print(f"Selecionados: {self.selecionados}")
        print(f"Total de linhas: {len(self.tabela.rows)}")
        if self.tabela.rows:
            print(f"Primeira linha - selected: {self.tabela.rows[0].selected}")

    def editar_produto(self, e) -> None:
        """Handler para edição de produto."""
        produto_id = self.obter_produto_selecionado()
        if produto_id:
            self.log_info(f"Iniciando edição do produto ID: {produto_id}")

    def excluir_produto(self, e) -> None:
        """Handler para exclusão de produto."""
        produto_id = self.obter_produto_selecionado()
        if produto_id:
            self.log_info(f"Iniciando exclusão do produto ID: {produto_id}")