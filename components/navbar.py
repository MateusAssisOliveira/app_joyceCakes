import flet as ft
from logs.logger import Logger

log = Logger()

class NavBar:
    def __init__(self, page_title="Minha Página", callbacks=None):
        """
        Construtor que inicializa o NavBar com título da página e um dicionário de callbacks.
        
        :param page_title: Título da página (default: "Minha Página")
        :param callbacks: Dicionário com as funções de callback para os botões
        """
        self.page_title = page_title

        # Se nenhum dicionário de callbacks for fornecido, define como um dicionário vazio
        self.callbacks = callbacks if callbacks else {}

    def set_callbacks(self,callbacks):
        self.callbacks = callbacks

    def build(self):
        """
        Constrói o layout do NavBar usando os callbacks fornecidos.
        
        :return: O layout do NavBar (ft.Column com botões e título)
        """
        # Geração dinâmica dos botões de acordo com o dicionário de callbacks
        buttons_home = self.criar_botao(self.callbacks.get("home"), 'Home', ft.Icons.HOME)
        buttons_novo = self.criar_botao(self.callbacks.get("novo"), 'Novo', ft.Icons.ADD)
        buttons_editar = self.criar_botao(self.callbacks.get("editar"), 'Editar', ft.Icons.EDIT)
        buttons_deletar = self.criar_botao(self.callbacks.get("deletar"), 'Deletar', ft.Icons.DELETE)

        return ft.Column(
            controls=[

                # Primeira linha: botão Home à esquerda, título centralizado
                ft.Container(
                    content=ft.Row(
                        controls=[

                            buttons_home,  # Botão "Home"
                            
                            # Título centralizado
                            ft.Container(
                                content=ft.Text(self.page_title, size=20, weight=ft.FontWeight.BOLD),
                                alignment=ft.alignment.center,
                                expand=True,
                                border=ft.border.all(1, "green"),
                                padding=1
                            ),
                        ],
                        alignment=ft.MainAxisAlignment.START
                    ),
                    border=ft.border.all(2, "red"),
                    padding=1
                ),

                # Segunda linha: ações centralizadas
                ft.Container(
                    content=ft.Row(
                        controls=[

                            buttons_novo,  # Botão "Novo"
                            buttons_editar,  # Botão "Editar"
                            buttons_deletar,  # Botão "Deletar"
                        ],
                        alignment=ft.MainAxisAlignment.CENTER
                    ),
                    border=ft.border.all(2, "orange"),
                    padding=1
                ),
            ],
            spacing=1
        )

    def criar_botao(self, callback, texto, icone):
        """
        Cria um botão com base no callback fornecido.
        
        :param callback: Função de callback associada ao botão
        :param texto: Texto do botão
        :param icone: Ícone do botão
        :return: Um botão do tipo ElevatedButton
        """
        return ft.Container(
            content=ft.ElevatedButton(
                text=texto,
                icon=icone,
                on_click=callback  # Função de callback passada para o botão
            ),
            border=ft.border.all(1, "purple"),
            padding=1
        )
