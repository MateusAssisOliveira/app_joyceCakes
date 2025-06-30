from logs.logger import Logger
import flet as ft
from typing import Optional, Callable, Dict, Any

class DialogProduto:
    """Diálogo reutilizável para adicionar ou editar produtos"""
    
    def __init__(self, page: ft.Page):
        self.page = page
        self.log = Logger()
        self.log.info("Inicializando o DialogProduto")
        
        # Configuração inicial dos campos
        self._setup_campos()
        self._setup_botoes()
        self._setup_dialog()

    def _setup_campos(self):
        """Configura todos os campos do formulário"""
        self.campo_id = ft.TextField(
            label="ID",
            disabled=True,
            visible=False,
            read_only=True
        )

        self.campo_nome = ft.TextField(
            label="Nome do Produto*",
            autofocus=True,
            capitalization=ft.TextCapitalization.WORDS,
            dense=True,
            content_padding=12,
            hint_text="Ex: Arroz Integral"
        )

        self.campo_descricao = ft.TextField(
            label="Descrição",
            multiline=True,
            min_lines=2,
            max_lines=4,
            dense=True,
            content_padding=12,
            hint_text="Descrição detalhada do produto"
        )

        self.campo_preco = ft.TextField(
            label="Preço*",
            prefix_text="R$ ",
            keyboard_type=ft.KeyboardType.NUMBER,
            hint_text="0.00",
            width=150,
            dense=True,
            content_padding=12,
            input_filter=ft.NumbersOnlyInputFilter()
        )

        self.campo_quantidade = ft.TextField(
            label="Quantidade*",
            keyboard_type=ft.KeyboardType.NUMBER,
            value="1",
            width=150,
            dense=True,
            content_padding=12,
            input_filter=ft.NumbersOnlyInputFilter()
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

    def _setup_botoes(self):
        """Configura os botões do diálogo"""
        self.botao_cancelar = ft.TextButton(
            text="Cancelar",
            style=ft.ButtonStyle(
                padding=ft.Padding(20, 10, 20, 10)
            )
        )

        self.botao_salvar = ft.ElevatedButton(
            text="Salvar",
            icon=ft.Icons.SAVE,
            style=ft.ButtonStyle(
                padding=ft.Padding(20, 10, 20, 10),
            )
        )

    def _setup_dialog(self):
        """Configura o diálogo principal"""
        self.dialog = ft.AlertDialog(
            modal=True,
            shape=ft.RoundedRectangleBorder(radius=10),
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
                width=400
            ),
            actions=[
                self.botao_cancelar,
                self.botao_salvar,
            ],
            actions_alignment=ft.MainAxisAlignment.END
        )

    def abrir(
        self,
        modo_edicao: bool = False,
        produto: Optional[Dict[str, Any]] = None,
        on_salvar: Optional[Callable[[Dict[str, Any]], None]] = None,
        on_cancelar: Optional[Callable[[], None]] = None
    ):
        """
        Abre o diálogo no modo de adição ou edição
        
        Args:
            modo_edicao: Se True, abre no modo edição (mostra ID)
            produto: Dicionário com dados do produto para edição
            on_salvar: Callback chamado ao salvar (recebe dados do produto)
            on_cancelar: Callback chamado ao cancelar
        """
        self.log.info(f"Abrindo diálogo no modo {'edição' if modo_edicao else 'adição'}")

        # Configura título e campos conforme o modo
        if modo_edicao:
            self.dialog.title = ft.Text("Editar Produto", size=18, weight=ft.FontWeight.BOLD)
            self._preencher_campos(produto)
            self.campo_id.visible = True
        else:
            self.dialog.title = ft.Text("Adicionar Produto", size=18, weight=ft.FontWeight.BOLD)
            self._limpar_campos()
            self.campo_id.visible = False

        # Configura handlers
        def salvar_handler(e):
            try:
                dados = self._coletar_dados()
                self._validar_dados(dados)
                
                # Feedback visual durante o salvamento
                self.botao_salvar.text = "Salvando..."
                self.botao_salvar.disabled = True
                self.page.update()
                
                if callable(on_salvar):
                    on_salvar(dados)
                    
                self.fechar()
            except ValueError as e:
                self._mostrar_erro(str(e))
                self.botao_salvar.text = "Salvar"
                self.botao_salvar.disabled = False
                self.page.update()

        def cancelar_handler(e):
            if callable(on_cancelar):
                on_cancelar()
            self.fechar()

        self.botao_salvar.on_click = salvar_handler
        self.botao_cancelar.on_click = cancelar_handler

        # Abre o diálogo
        
        self.dialog.open = True
        self.page.dialog = self.dialog
        self.page.open(self.dialog)
        self.page.update()

    def fechar(self):
        """Fecha o diálogo"""
        self.log.info("Fechando diálogo")
        self.dialog.open = False
        self.page.update()

    def _preencher_campos(self, produto: Dict[str, Any]):
        """Preenche os campos com os dados do produto"""
        self.campo_id.value = str(produto.get("id", ""))
        self.campo_nome.value = produto.get("nome", "")
        self.campo_descricao.value = produto.get("descricao", "")
        self.campo_preco.value = str(produto.get("preco", "0"))
        self.campo_quantidade.value = str(produto.get("quantidade", "1"))
        self.campo_tipo.value = produto.get("tipo", "unidade")

    def _limpar_campos(self):
        """Limpa todos os campos do formulário"""
        self.campo_id.value = ""
        self.campo_nome.value = ""
        self.campo_descricao.value = ""
        self.campo_preco.value = ""
        self.campo_quantidade.value = "1"
        self.campo_tipo.value = "unidade"

    def _coletar_dados(self) -> Dict[str, Any]:
        """Coleta e formata os dados do formulário"""
        return {
            "id": self.campo_id.value if self.campo_id.visible else None,
            "nome": self.campo_nome.value.strip(),
            "descricao": self.campo_descricao.value.strip(),
            "preco": self._formatar_preco(self.campo_preco.value),
            "quantidade": self._formatar_quantidade(self.campo_quantidade.value),
            "tipo": self.campo_tipo.value
        }

    def _validar_dados(self, dados: Dict[str, Any]):
        """Valida os dados antes de salvar"""
        if not dados["nome"]:
            raise ValueError("Nome do produto é obrigatório")
        if dados["preco"] < 0:
            raise ValueError("Preço não pode ser negativo")
        if dados["quantidade"] <= 0:
            raise ValueError("Quantidade deve ser maior que zero")

    def _formatar_preco(self, valor: str) -> float:
        """Converte e formata o preço"""
        try:
            return round(float(valor.replace(",", ".")) if valor else 0.0, 2)
        except ValueError:
            raise ValueError("Preço inválido. Use números com até 2 casas decimais")

    def _formatar_quantidade(self, valor: str) -> int:
        """Converte a quantidade para inteiro"""
        try:
            return int(valor) if valor else 1
        except ValueError:
            raise ValueError("Quantidade deve ser um número inteiro")

    def _mostrar_erro(self, mensagem: str):
        """Exibe mensagem de erro"""
        self.page.snack_bar = ft.SnackBar(
            content=ft.Text(mensagem, color=ft.Colors.WHITE),
            bgcolor=ft.Colors.RED_400
        )
        self.page.snack_bar.open = True
        self.page.update()