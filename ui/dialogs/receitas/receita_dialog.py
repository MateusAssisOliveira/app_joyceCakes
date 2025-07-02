from typing import Any, Dict, List
import flet as ft

from logs.logger import Logger
from ui.forms.ingrediente.ingrediente_form import IngredienteForm
from ui.forms.receita.receita_form import ReceitaForm


class DialogReceita:
    def __init__(self, page: ft.Page, produtos: List[Dict[str, Any]],logge : Logger):
        self.page = page
        self.receita_form = ReceitaForm()
        self.log = logge
        self.ingrediente_form = IngredienteForm(produtos,self.page,self.log)
        self._setup_botoes()
        self._setup_dialog()
    
    def _setup_botoes(self):
        self.botao_cancelar = ft.TextButton("Cancelar")
        self.botao_salvar = ft.ElevatedButton(text="Salvar", icon=ft.Icons.SAVE)
    
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
    
    def abrir(self, modo_edicao=False, receita=None, on_salvar=None):
        if modo_edicao and receita:
            self.receita_form.preencher_campos(receita)
            self.dialog.title = ft.Text(f"Editar: {receita['nome']}")
        else:
            self.receita_form.limpar_campos()
            self.dialog.title = ft.Text("Nova Receita")

        self.botao_salvar.on_click = lambda e: self._salvar_receita(on_salvar)
        self.botao_cancelar.on_click = lambda e: self.fechar()

        # CORREÇÃO: Primeiro atribui o diálogo à página, depois abre
        self.page.dialog = self.dialog
        self.dialog.open = True
        self.page.open(self.dialog)
        self.page.update()  # Atualiza apenas uma vez
    
    def _salvar_receita(self, callback):
        try:
            dados = self.receita_form.get_valores()
            dados["ingredientes"] = self.ingrediente_form.get_ingredientes()
            
            self._validar_dados(dados)
            
            if callback:
                callback(dados)
            self.fechar()
            
        except Exception as e:
            self._mostrar_erro(str(e))
    
    def fechar(self):
        self.dialog.open = False
        self.page.update()
    
    def _mostrar_erro(self, mensagem):
        self.page.snack_bar = ft.SnackBar(
            content=ft.Text(mensagem),
            bgcolor=ft.Colors.RED
        )
        self.page.snack_bar.open = True
        self.page.update()
    
    def _validar_dados(self, dados: Dict[str, Any]):
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