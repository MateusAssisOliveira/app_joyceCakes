from typing import Any, Dict, List
import flet as ft

from logs.logger import Logger
from ui.forms.add_ingrediente_dialog_receita.ingrediente_form import IngredienteForm
from ui.forms.receita.form_add_receita import ReceitaForm


class DialogReceita:
    def __init__(self, page: ft.Page, produtos: List[Dict[str, Any]], logge: Logger):
        self.page = page
        self.log = logge
        self.receita_form = ReceitaForm()
        self.ingrediente_form = IngredienteForm(produtos, self.page, self.log)
        self._setup_botoes()
        self._setup_dialog()

        self.log.info("DialogReceita inicializado com sucesso.")

    def _setup_botoes(self):
        self.botao_cancelar = ft.TextButton("Cancelar")
        self.botao_salvar = ft.ElevatedButton(text="Salvar", icon=ft.Icons.SAVE)
        self.log.debug("Botões de ação configurados.")

    def _setup_dialog(self):
        self.dialog = ft.AlertDialog(
            modal=True,
            title=ft.Text("Nova Receita"),
            content=ft.Column(
                controls=[
                    *self.receita_form.get_campos(),
                    ft.Divider(),
                    ft.Text("Ingredientes:", weight=ft.FontWeight.BOLD),
                    self.ingrediente_form.build(),
                    self.ingrediente_form.lista_ingredientes
                ],
                scroll=ft.ScrollMode.AUTO,
                height=500,
                width=600
            ),
            actions=[self.botao_cancelar, self.botao_salvar],
            actions_alignment=ft.MainAxisAlignment.END
        )
        self.log.debug("Diálogo de receita configurado.")

    def abrir(self, modo_edicao=False, receita=None, on_salvar=None):
        try:
            if modo_edicao and receita:
                self.receita_form.preencher_campos(receita)
                self.dialog.title = ft.Text(f"Editar: {receita['nome']}")
                self.log.info(f"Abrindo diálogo em modo edição para receita: {receita['nome']}")
            else:
                self.receita_form.limpar_campos()
                self.dialog.title = ft.Text("Nova Receita")
                self.log.info("Abrindo diálogo em modo criação de nova receita.")

            self.botao_salvar.on_click = lambda e: self._salvar_receita(on_salvar)
            self.botao_cancelar.on_click = lambda e: self.fechar()

            self.page.dialog = self.dialog
            self.dialog.open = True
            self.page.open(self.dialog)
            self.page.update()
        except Exception as e:
            self.log.error(f"Erro ao abrir o diálogo de receita: {e}")
            self._mostrar_erro("Erro ao abrir o formulário.")

    def _salvar_receita(self, callback):

        try:
            dados = self.receita_form.get_valores()
            dados["ingredientes"] = self.ingrediente_form.get_ingredientes()
            self.log.info(f"Iniciando o salvamneto da receita : {dados['nome']}")

            self._validar_dados(dados)

            if callback:
                callback(dados)
                self.log.info(f"Receita salva com sucesso: {dados['nome']}")

            self.fechar()

        except Exception as e:
            self.log.warning(f"Erro ao salvar receita: {e}")
            self._mostrar_erro(str(e))

    def fechar(self):
        
        self.dialog.open = False
        self.page.update()
        self.log.debug("Diálogo de receita fechado.")

    def _mostrar_erro(self, mensagem):
        self.page.snack_bar = ft.SnackBar(
            content=ft.Text(mensagem),
            bgcolor=ft.Colors.RED
        )
        self.page.snack_bar.open = True
        self.page.update()
        self.log.warning(f"Erro exibido ao usuário: {mensagem}")

    def _validar_dados(self, dados: Dict[str, Any]):
        if not dados["nome"]:
            raise ValueError("Nome da receita é obrigatório")
        if not dados["categoria_id"]:
            raise ValueError("Categoria é obrigatória")
        if not dados["modo_preparo"]:
            raise ValueError("Modo de preparo é obrigatório")
        if dados["tempo_preparo"] <= 0:
            raise ValueError("Tempo de preparo deve ser maior que zero")
        if dados["rendimento"] <= 0:
            raise ValueError("Rendimento deve ser maior que zero")
        if not dados["ingredientes"]:
            raise ValueError("Adicione pelo menos um ingrediente")

        self.log.debug("Dados da receita validados com sucesso.")
