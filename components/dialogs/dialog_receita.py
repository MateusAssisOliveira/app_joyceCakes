from logs.logger import Logger
import flet as ft
from typing import Optional, Callable, Dict, Any, List
from datetime import datetime

class DialogReceita:
    """Diálogo para adicionar/editar receitas e preparações"""
    
    def __init__(self, page: ft.Page, produtos: List[Dict[str, Any]]):
        self.page = page
        self.produtos = produtos
        self.log = Logger()
        self.log.info("Inicializando DialogReceita")
        
        self._setup_campos()
        self._setup_botoes()
        self._setup_dialog()

    def _setup_campos(self):
        """Configura campos do formulário de receita"""
        self.campo_id = ft.TextField(
            label="ID",
            disabled=True,
            visible=False
        )

        self.campo_nome = ft.TextField(
            label="Nome da Receita*",
            capitalization=ft.TextCapitalization.WORDS,
            hint_text="Ex: Bolo de Chocolate"
        )

        self.campo_categoria = ft.Dropdown(
            label="Categoria*",
            options=[
                ft.dropdown.Option("bolos", "Bolos"),
                ft.dropdown.Option("sobremesas", "Sobremesas"),
                ft.dropdown.Option("paes", "Pães e Massas"),
            ],
            hint_text="Selecione uma categoria"
        )

        self.campo_modo_preparo = ft.TextField(
            label="Modo de Preparo*",
            multiline=True,
            min_lines=4,
            max_lines=8
        )

        self.campo_tempo = ft.TextField(
            label="Tempo (minutos)*",
            keyboard_type=ft.KeyboardType.NUMBER,
            width=120
        )

        self.campo_rendimento = ft.TextField(
            label="Rendimento*",
            width=120,
            suffix_text="porções"
        )

        self.campo_dificuldade = ft.Dropdown(
            label="Dificuldade*",
            options=[
                ft.dropdown.Option("facil", "Fácil"),
                ft.dropdown.Option("medio", "Médio"),
                ft.dropdown.Option("dificil", "Difícil"),
            ],
            value="facil"
        )

        # Lista de ingredientes
        self.lista_ingredientes = ft.ListView(expand=True)
        self.botao_add_ingrediente = ft.ElevatedButton(
            text="Adicionar Ingrediente",
            icon=ft.Icons.ADD,
            on_click=self._adicionar_ingrediente
        )

    def _setup_botoes(self):
        """Configura botões do diálogo"""
        self.botao_cancelar = ft.TextButton("Cancelar")
        self.botao_salvar = ft.ElevatedButton(
            text="Salvar",
            icon=ft.Icons.SAVE
        )

    def _setup_dialog(self):
        """Configura o diálogo principal"""
        self.dialog = ft.AlertDialog(
            modal=True,
            title=ft.Text("Nova Receita"),
            content=ft.Column(
                controls=[
                    self.campo_id,
                    self.campo_nome,
                    ft.Row([self.campo_categoria, self.campo_dificuldade]),
                    ft.Row([self.campo_tempo, self.campo_rendimento]),
                    self.campo_modo_preparo,
                    ft.Divider(),
                    ft.Text("Ingredientes:", weight=ft.FontWeight.BOLD),
                    self.lista_ingredientes,
                    self.botao_add_ingrediente
                ],
                scroll=ft.ScrollMode.AUTO,
                height=500,
                width=600
            ),
            actions=[self.botao_cancelar, self.botao_salvar],
            actions_alignment=ft.MainAxisAlignment.END
        )

    def _adicionar_ingrediente(self, e):
        """Adiciona um novo ingrediente à lista"""
        dialog_ingrediente = ft.AlertDialog(
            title=ft.Text("Adicionar Ingrediente"),
            content=ft.Column([
                ft.Dropdown(
                    label="Produto",
                    options=[ft.dropdown.Option(p["id"], p["nome"]) for p in self.produtos],
                    on_change=self._atualizar_unidade
                ),
                ft.Row([
                    ft.TextField(label="Quantidade", width=150),
                    ft.Text("un", key="label_unidade")  # Alterado 'id' para 'key'
                ]),
                ft.TextField(label="Observações", multiline=True)
            ]),
            actions=[
                ft.TextButton("Cancelar"),
                ft.TextButton("Adicionar", on_click=self._confirmar_ingrediente)
            ]
        )
        self.page.dialog = dialog_ingrediente
        dialog_ingrediente.open = True
        self.page.open(dialog_ingrediente)
        self.page.update()

    def abrir(self, modo_edicao=False, receita=None, on_salvar=None):
        """Abre o diálogo no modo adição ou edição"""
        if modo_edicao and receita:
            self._preencher_campos(receita)
            self.dialog.title = ft.Text(f"Editar: {receita['nome']}")
        else:
            self._limpar_campos()
            self.dialog.title = ft.Text("Nova Receita")

        self.botao_salvar.on_click = lambda e: self._salvar_receita(on_salvar)
        self.botao_cancelar.on_click = lambda e: self.fechar()

        self.page.dialog = self.dialog
        self.dialog.open = True
        self.page.open(self.dialog)
        self.page.update()

    def _salvar_receita(self, callback):
        """Valida e coleta os dados para salvar"""
        try:
            dados = {
                "id": self.campo_id.value if self.campo_id.visible else None,
                "nome": self.campo_nome.value.strip(),
                "categoria": self.campo_categoria.value,
                "modo_preparo": self.campo_modo_preparo.value.strip(),
                "tempo": int(self.campo_tempo.value),
                "rendimento": float(self.campo_rendimento.value),
                "dificuldade": self.campo_dificuldade.value,
                "ingredientes": self._get_ingredientes()
            }
            
            self._validar_dados(dados)
            
            if callback:
                callback(dados)
            self.fechar()
            
        except Exception as e:
            self._mostrar_erro(str(e))

    def fechar(self):
        """Fecha o diálogo"""
        self.dialog.open = False
        self.page.update()

    def _mostrar_erro(self, mensagem):
        """Exibe mensagem de erro"""
        self.page.snack_bar = ft.SnackBar(
            content=ft.Text(mensagem),
            bgcolor=ft.Colors.RED
        )
        self.page.snack_bar.open = True
        self.page.update()

    def _preencher_campos(self, receita: Dict[str, Any]):
        """Preenche os campos com os dados da receita"""
        self.campo_id.value = str(receita.get("id", ""))
        self.campo_id.visible = True
        self.campo_nome.value = receita.get("nome", "")
        self.campo_categoria.value = receita.get("categoria", "")
        self.campo_modo_preparo.value = receita.get("modo_preparo", "")
        self.campo_tempo.value = str(receita.get("tempo", ""))
        self.campo_rendimento.value = str(receita.get("rendimento", ""))
        self.campo_dificuldade.value = receita.get("dificuldade", "facil")
        
        # Limpa e recria a lista de ingredientes
        self.lista_ingredientes.controls.clear()
        for ingrediente in receita.get("ingredientes", []):
            self._adicionar_ingrediente_ui(ingrediente)
        
        self.page.update()

    def _limpar_campos(self):
        """Limpa todos os campos do formulário"""
        self.campo_id.value = ""
        self.campo_id.visible = False
        self.campo_nome.value = ""
        self.campo_categoria.value = ""
        self.campo_modo_preparo.value = ""
        self.campo_tempo.value = ""
        self.campo_rendimento.value = ""
        self.campo_dificuldade.value = "facil"
        self.lista_ingredientes.controls.clear()
        self.page.update()

    def _validar_dados(self, dados: Dict[str, Any]):
        """Valida os dados antes de salvar"""
        if not dados["nome"]:
            raise ValueError("Nome da receita é obrigatório")
        
        if not dados["categoria"]:
            raise ValueError("Categoria é obrigatória")
        
        if not dados["modo_preparo"]:
            raise ValueError("Modo de preparo é obrigatório")
        
        if dados["tempo"] <= 0:
            raise ValueError("Tempo de preparo deve ser maior que zero")
        
        if dados["rendimento"] <= 0:
            raise ValueError("Rendimento deve ser maior que zero")
        
        if not dados["ingredientes"]:
            raise ValueError("Adicione pelo menos um ingrediente")

    def _get_ingredientes(self) -> List[Dict[str, Any]]:
        """Retorna a lista de ingredientes formatada"""
        ingredientes = []
        for item in self.lista_ingredientes.controls:
            # Cada item da lista é um Card com os dados do ingrediente
            ingredientes.append({
                "produto_id": item.data["produto_id"],
                "quantidade": item.data["quantidade"],
                "unidade": item.data["unidade"],
                "observacoes": item.data["observacoes"]
            })
        return ingredientes

    def _atualizar_unidade(self, e):
        """Atualiza a unidade de medida quando seleciona um produto"""
        produto_id = e.control.value
        produto = next((p for p in self.produtos if p["id"] == produto_id), None)
        if produto:
            self.page.get_control("label_unidade").value = produto.get("unidade", "un")
            self.page.update()

    def _confirmar_ingrediente(self, e):
        """Confirma a adição do ingrediente à lista"""
        try:
            produto_id = self.page.dialog.content.controls[0].value
            quantidade = float(self.page.dialog.content.controls[1].controls[0].value)
            observacoes = self.page.dialog.content.controls[2].value
            
            if not produto_id:
                raise ValueError("Selecione um produto")
            
            if quantidade <= 0:
                raise ValueError("Quantidade deve ser maior que zero")
            
            produto = next((p for p in self.produtos if p["id"] == produto_id), None)
            if not produto:
                raise ValueError("Produto não encontrado")
            
            ingrediente = {
                "produto_id": produto_id,
                "nome": produto["nome"],
                "quantidade": quantidade,
                "unidade": produto.get("unidade", "un"),
                "observacoes": observacoes
            }
            
            self._adicionar_ingrediente_ui(ingrediente)
            self.page.dialog.open = False
            self.page.update()
            
        except ValueError as e:
            self._mostrar_erro(str(e))

    def _adicionar_ingrediente_ui(self, ingrediente: Dict[str, Any]):
        """Adiciona um ingrediente à interface"""
        card = ft.Card(
            content=ft.Container(
                content=ft.Column([
                    ft.ListTile(
                        title=ft.Text(ingrediente["nome"]),
                        subtitle=ft.Text(f"{ingrediente['quantidade']} {ingrediente['unidade']}"),
                        trailing=ft.IconButton(
                            icon=ft.Icons.DELETE,
                            on_click=lambda e, card=card: self._remover_ingrediente(e, card)
                        ),
                    ),
                    ft.Text(ingrediente.get("observacoes", ""), size=12) if ingrediente.get("observacoes") else None
                ]),
                padding=10,
            ),
            data=ingrediente  # Armazena os dados originais
        )
        
        self.lista_ingredientes.controls.append(card)
        self.page.update()

    def _remover_ingrediente(self, e, card: ft.Card):
        """Remove um ingrediente da lista"""
        self.lista_ingredientes.controls.remove(card)
        self.page.update()