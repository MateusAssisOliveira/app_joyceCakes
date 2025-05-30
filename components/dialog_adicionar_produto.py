from logs.logger import Logger
import flet as ft
from typing import Optional, Callable, Dict, Any

class DialogAdicionarProduto:
    
    def __init__(self, page: ft.Page, title: str = "Adicionar Produto"):
        self.page = page
        self.log = Logger()
        self.log.info("Inicializando o DialogAdicionarProduto")
        
        # Campos do formulário
        self.campo_id = ft.TextField(
            label="ID (opcional)",
            disabled=True,
            visible=False
        )

        self.campo_nome = ft.TextField(
            label="Nome do Produto*",
            autofocus=True,
            capitalization=ft.TextCapitalization.WORDS,
            dense=True,
            content_padding=12
        )

        self.campo_descricao = ft.TextField(
            label="Descrição",
            multiline=True,
            min_lines=2,
            max_lines=4,
            dense=True,
            content_padding=12
        )

        self.campo_preco = ft.TextField(
            label="Preço*",
            prefix_text="R\$ ",
            keyboard_type=ft.KeyboardType.NUMBER,
            hint_text="0.00",
            width=150,
            dense=True,
            content_padding=12
        )

        self.campo_quantidade = ft.TextField(
            label="Quantidade*",
            keyboard_type=ft.KeyboardType.NUMBER,
            value="1",
            width=150,
            dense=True,
            content_padding=12
        )

        self.campo_tipo = ft.Dropdown(
            label="Tipo de medida*",
            options=[
                ft.dropdown.Option("unidade", "Unidade"),
                ft.dropdown.Option("kg", "Quilograma (kg)"),
                ft.dropdown.Option("litro", "Litro (L)"),
                ft.dropdown.Option("pacote", "Pacote"),
                ft.dropdown.Option("caixa", "Caixa"),
            ],
            value="unidade",
            dense=True,
            content_padding=12
        )

        # Botões com estilo melhorado
        self.botao_cancelar = ft.TextButton(
            text="Cancelar",
            style=ft.ButtonStyle(
                padding=ft.Padding(20, 10, 20, 10)
            )
        )

        self.botao_salvar = ft.TextButton(
            text=ft.Text("Salvar", weight=ft.FontWeight.BOLD),
            style=ft.ButtonStyle(
                padding=ft.Padding(20, 10, 20, 10),
                bgcolor=ft.Colors.BLUE_700,
                color=ft.Colors.WHITE
            )
        )

        try:
            self.dialog = ft.AlertDialog(
                title=ft.Text(title, size=18, weight=ft.FontWeight.BOLD),
                content=ft.Container(
                    content=ft.Column(
                        controls=[
                            self.campo_id,
                            self.campo_nome,
                            self.campo_descricao,
                            ft.Row(
                                controls=[self.campo_preco, self.campo_quantidade],
                                spacing=20,
                                alignment=ft.MainAxisAlignment.SPACE_BETWEEN
                            ),
                            self.campo_tipo
                        ],
                        spacing=15,
                        scroll=ft.ScrollMode.AUTO,
                    ),
                    padding=ft.Padding(20, 10, 20, 10),
                    width=400  # Largura fixa para melhor controle
                ),
                actions=[
                    self.botao_cancelar,
                    self.botao_salvar,
                ],
                actions_alignment=ft.MainAxisAlignment.END,
                modal=True,
                shape=ft.RoundedRectangleBorder(radius=10)
            )
            self.log.info("Diálogo inicializado com sucesso.")
        except Exception as e:
            self.log.error(f"Erro ao inicializar o diálogo: {e}")
            raise

    def mostrar(
        self,
        on_salvar: Optional[Callable[[Dict[str, Any]], None]] = None,
        on_cancelar: Optional[Callable[[], None]] = None,
        produto_existente: Optional[Dict[str, Any]] = None
    ):
        """Exibe o diálogo na página"""
        self.log.info("Exibindo o diálogo para adicionar/editar produto.")
        
        # Preenche os campos se for edição
        if produto_existente:
            self.log.info(f"Editando produto: {produto_existente}")
            self.campo_id.value = produto_existente.get("id", "")
            self.campo_id.visible = True
            self.campo_nome.value = produto_existente.get("nome", "")
            self.campo_descricao.value = produto_existente.get("descricao", "")
            self.campo_preco.value = str(produto_existente.get("preco", "0"))
            self.campo_quantidade.value = str(produto_existente.get("quantidade", "1"))
            self.campo_tipo.value = produto_existente.get("tipo", "unidade")
        else:
            self.log.info("Criando novo produto.")
            # Limpa os campos para novo produto
            self.campo_id.value = ""
            self.campo_id.visible = False
            self.campo_nome.value = ""
            self.campo_descricao.value = ""
            self.campo_preco.value = ""
            self.campo_quantidade.value = "1"
            self.campo_tipo.value = "unidade"
        
        # Configuração dos handlers com estado inicial
        self.botao_salvar.on_click = None
        self.botao_cancelar.on_click = None

        # Função para validar e coletar dados
        def coletar_dados() -> Dict[str, Any]:
            self.log.info("Coletando dados do formulário.")
            return {
                "id": self.campo_id.value if self.campo_id.value else None,
                "nome": self.campo_nome.value.strip(),
                "descricao": self.campo_descricao.value.strip(),
                "preco": self._validar_preco(self.campo_preco.value),
                "quantidade": self._validar_quantidade(self.campo_quantidade.value),
                "tipo": self.campo_tipo.value
            }

        # Handler do botão salvar
        def salvar(e):
            try:
                dados = coletar_dados()
                self.log.info(f"Dados coletados: {dados}")
                
                if not dados["nome"]:
                    raise ValueError("Nome do produto é obrigatório")
                
                # Adiciona feedback visual durante o processamento
                self.log.info("Iniciando processo de salvamento...")
                self.botao_salvar.text = "Salvando..."
                self.botao_salvar.disabled = True
                self.page.update()

                if callable(on_salvar):
                    self.log.info("Chamada para on_salvar.")
                    on_salvar(dados)

                # Fecha o diálogo após salvar com sucesso
                self.log.info("Produto salvo com sucesso.")
                self.fechar()
                
            except ValueError as ve:
                self.log.error(f"Erro durante o salvamento: {str(ve)}")
                self._mostrar_erro(str(ve))
                self.botao_salvar.text = "Salvar"
                self.botao_salvar.disabled = False
                self.page.update()

        # Handler do botão cancelar
        def cancelar(e):
            self.log.info("Operação cancelada pelo usuário.")
            if callable(on_cancelar):
                on_cancelar()
            self.fechar()

        # Atribui os handlers
        self.botao_salvar.on_click = salvar
        self.botao_cancelar.on_click = cancelar
        
        # Abre o diálogo
        self.log.info("Abrindo o diálogo.")
        self.dialog.open = True
        self.page.open(self.dialog)
        self.page.update()

    def fechar(self):
        """Fecha o diálogo"""
        self.log.info("Fechando o diálogo.")
        self.dialog.open = False
        self.page.update()

    def _validar_preco(self, valor: str) -> float:
        """Valida e formata o preço"""
        try:
            preco = float(valor.replace(",", ".")) if valor else 0.0
            if preco < 0:
                raise ValueError("Preço não pode ser negativo")
            self.log.info(f"Preço validado: R$ {preco}")
            return round(preco, 2)
        except ValueError:
            self.log.error("Erro ao validar preço: valor inválido.")
            raise ValueError("Preço inválido. Use números com até 2 casas decimais")

    def _validar_quantidade(self, valor: str) -> int:
        """Valida a quantidade"""
        try:
            quantidade = int(valor) if valor else 1
            if quantidade <= 0:
                raise ValueError("Quantidade deve ser maior que zero")
            self.log.info(f"Quantidade validada: {quantidade}")
            return quantidade
        except ValueError:
            self.log.error("Erro ao validar quantidade: valor inválido.")
            raise ValueError("Quantidade deve ser um número inteiro")

    def _mostrar_erro(self, mensagem: str):
        """Exibe mensagem de erro na página"""
        self.log.error(f"Exibindo erro: {mensagem}")
        self.page.snack_bar = ft.SnackBar(
            content=ft.Text(mensagem, color=ft.Colors.ERROR),
            bgcolor=ft.Colors.ERROR_CONTAINER
        )
        self.page.snack_bar.open = True
        self.page.update()
