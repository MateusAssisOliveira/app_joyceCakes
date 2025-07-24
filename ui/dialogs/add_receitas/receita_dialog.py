from typing import Any, Dict, List
import flet as ft

from logs.logger import Logger
from ui.forms.add_ingrediente_dialog_receita.ingrediente_form import IngredienteForm
from ui.forms.receita.form_add_receita import ReceitaForm
from util.retornos import Retorno


class DialogReceita:
    def __init__(self, page: ft.Page, produtos: List[Dict[str, Any]], logger: Logger):
        self.page = page
        self.log = logger
        self.receita_form = ReceitaForm()
        self.ingrediente_form = IngredienteForm(produtos, self.page, self.log)
        self._setup_botoes()
        self._setup_dialog()

        self.log.info("DialogReceita inicializado com sucesso.")

    def _setup_botoes(self) -> Dict[str, Any]:
        """Configura os botões do diálogo"""
        try:
            self.botao_cancelar = ft.TextButton("Cancelar")
            self.botao_salvar = ft.ElevatedButton(text="Salvar", icon=ft.Icons.SAVE)
            self.log.debug("Botões de ação configurados.")
            return Retorno.sucesso("Botões configurados com sucesso")
        except Exception as e:
            error_msg = f"Erro ao configurar botões: {str(e)}"
            self.log.error(error_msg)
            return Retorno.erro(error_msg)

    def _setup_dialog(self) -> Dict[str, Any]:
        """Configura o diálogo principal com tratamento completo de erros"""
        try:
            # 1. Validação do build do ingrediente_form
            resultado_build = self.ingrediente_form.build()
            if not resultado_build.get("ok"):
                self.log.error(f"Falha no build: {resultado_build.get('mensagem', 'Erro desconhecido')}")
                return Retorno.erro("Falha ao construir formulário de ingredientes")

            # 2. Validação da estrutura do retorno
            if "dados" not in resultado_build or "widget" not in resultado_build["dados"]:
                error_msg = "Estrutura de retorno do build inválida"
                self.log.error(error_msg)
                return Retorno.erro(error_msg)

            # 3. Validação do widget retornado
            ingrediente_widget = resultado_build["dados"]["widget"]
            if not isinstance(ingrediente_widget, ft.Control):
                error_msg = "O widget retornado não é um controle Flet válido"
                self.log.error(error_msg)
                return Retorno.erro(error_msg)

            # 4. Validação da lista de ingredientes
            if not hasattr(self.ingrediente_form, 'lista_ingredientes'):
                error_msg = "lista_ingredientes não encontrada no formulário"
                self.log.error(error_msg)
                return Retorno.erro(error_msg)

            # 5. Construção do diálogo principal
            self.dialog = ft.AlertDialog(
                modal=True,
                title=ft.Text("Nova Receita"),
                content=ft.Column(
                    controls=[
                        *self.receita_form.get_campos(),
                        ft.Divider(),
                        ft.Text("Ingredientes:", weight=ft.FontWeight.BOLD),
                        ingrediente_widget,
                        self.ingrediente_form.lista_ingredientes
                    ],
                    scroll=ft.ScrollMode.AUTO,
                    height=500,
                    width=600
                ),
                actions=[self.botao_cancelar, self.botao_salvar],
                actions_alignment=ft.MainAxisAlignment.END
            )
            
            self.log.debug("Diálogo configurado com sucesso")
            return Retorno.sucesso("Diálogo configurado com sucesso")

        except Exception as e:
            error_msg = f"Erro crítico ao configurar diálogo: {str(e)}"
            self.log.error(error_msg, exc_info=True)
            return Retorno.erro(error_msg)

    def abrir(self, modo_edicao=False, receita=None, on_salvar=None) -> Dict[str, Any]:


        """Abre o diálogo de receita"""
        try:
            if modo_edicao and receita:
                resultado = self.receita_form.preencher_campos(receita)
                if not resultado.get("ok", False):
                    return resultado
                
                self.dialog.title = ft.Text(f"Editar: {receita['nome']}")
                self.log.info(f"Abrindo diálogo em modo edição para receita: {receita['nome']}")
            else:
                resultado = self.receita_form.limpar_campos()
                if not resultado.get("ok", False):
                    return resultado
                    
                self.dialog.title = ft.Text("Nova Receita")
                self.log.info("Abrindo diálogo em modo criação de nova receita.")

            self.botao_salvar.on_click = lambda e: self._salvar_receita(on_salvar)
            self.botao_cancelar.on_click = lambda e: self.fechar()

            self.page.dialog = self.dialog
            self.dialog.open = True
            self.page.open(self.dialog)
            self.page.update()
            
            return Retorno.sucesso("Diálogo aberto com sucesso")
        
        except Exception as e:
            error_msg = f"Erro ao abrir o diálogo de receita: {str(e)}"
            self.log.error(error_msg)
            self._mostrar_erro("Erro ao abrir o formulário.")
            return Retorno.erro(error_msg)

    def _salvar_receita(self, callback) -> Dict[str, Any]:
        """Salva os dados da receita"""
        try:
            resultado_dados = self.receita_form.get_valores()
            if not resultado_dados.get("ok", False):
                return resultado_dados
                
            resultado_ingredientes = self.ingrediente_form.get_ingredientes()
            if not resultado_ingredientes.get("ok", False):
                return resultado_ingredientes
                
            dados = resultado_dados['dados']
            dados["ingredientes"] = resultado_ingredientes['dados']
            
            self.log.info(f"Iniciando o salvamento da receita: {dados.get('nome', 'Nova receita')}")

            resultado_validacao = self._validar_dados(dados)
            if not resultado_validacao.get("ok", False):
                return resultado_validacao

            if callback:
                callback(dados)
                self.log.info(f"Receita salva com sucesso: {dados.get('nome', 'Nova receita')}")

            self.fechar()
            return Retorno.sucesso("Receita salva com sucesso", dados)
            
        except Exception as e:
            error_msg = f"Erro ao salvar receita: {str(e)}"
            self.log.warning(error_msg)
            self._mostrar_erro(str(e))
            return Retorno.erro(error_msg)

    def fechar(self) -> Dict[str, Any]:
        """Fecha o diálogo"""
        try:
            self.dialog.open = False
            self.page.update()
            self.log.debug("Diálogo de receita fechado.")
            return Retorno.sucesso("Diálogo fechado com sucesso")
        except Exception as e:
            error_msg = f"Erro ao fechar diálogo: {str(e)}"
            self.log.error(error_msg)
            return Retorno.erro(error_msg)

    def _mostrar_erro(self, mensagem: str) -> Dict[str, Any]:
        """Exibe mensagem de erro ao usuário"""
        try:
            self.page.snack_bar = ft.SnackBar(
                content=ft.Text(mensagem),
                bgcolor=ft.Colors.RED
            )
            self.page.snack_bar.open = True
            self.page.update()
            self.log.warning(f"Erro exibido ao usuário: {mensagem}")
            return Retorno.sucesso("Erro exibido ao usuário")
        except Exception as e:
            error_msg = f"Erro ao exibir mensagem de erro: {str(e)}"
            self.log.error(error_msg)
            return Retorno.erro(error_msg)

    def _validar_dados(self, dados: Dict[str, Any]) -> Dict[str, Any]:
        """Valida os dados da receita"""
        try:
            if not dados.get("nome"):
                raise ValueError("Nome da receita é obrigatório")
            if not dados.get("categoria_id"):
                raise ValueError("Categoria é obrigatória")
            if not dados.get("modo_preparo"):
                raise ValueError("Modo de preparo é obrigatório")
            if dados.get("tempo_preparo", 0) <= 0:
                raise ValueError("Tempo de preparo deve ser maior que zero")
            if dados.get("rendimento", 0) <= 0:
                raise ValueError("Rendimento deve ser maior que zero")
            if not dados.get("ingredientes"):
                raise ValueError("Adicione pelo menos um ingrediente")

            self.log.debug("Dados da receita validados com sucesso.")
            return Retorno.sucesso("Dados validados com sucesso")
        except ValueError as e:
            error_msg = str(e)
            self.log.warning(f"Validação falhou: {error_msg}")
            return Retorno.dados_invalidos(error_msg)
        except Exception as e:
            error_msg = f"Erro inesperado na validação: {str(e)}"
            self.log.error(error_msg)
            return Retorno.erro(error_msg)