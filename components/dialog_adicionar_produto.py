from logs.logger import Logger
import flet as ft

class DialogAdicionarProduto:
    
    def __init__(self, page: ft.Page, title="Adicionar Produto"):
        self.page = page
        self.log = Logger()
        self.log.info("Inicializando o DialogAdicionarProduto")
        
        # Cria os campos do formulário
        self.campo_nome = ft.TextField(label="Nome do Produto", autofocus=True)
        self.campo_quantidade = ft.TextField(
            label="Quantidade", 
            keyboard_type=ft.KeyboardType.NUMBER,
            value="1"
        )
        
        # Cria os botões
        self.botao_cancelar = ft.TextButton("Cancelar")
        self.botao_salvar = ft.TextButton("Salvar")
        
        try:
            self.dialog = ft.AlertDialog(
                title=ft.Text(title),
                content=ft.Column([
                    self.campo_nome,
                    self.campo_quantidade
                ], tight=True),
                actions=[self.botao_cancelar, self.botao_salvar],
                modal=True
            )
            self.log.info("Diálogo inicializado com sucesso.")
        except Exception as e:
            self.log.error(f"Erro ao inicializar o diálogo: {e}")
            raise

    def mostrar(self, on_salvar=None, on_cancelar=None):
        """Exibe o diálogo na página"""
        self.log.info("Exibindo o diálogo para adicionar produto.")
        
        # Limpa os campos antes de mostrar
        self.campo_nome.value = ""
        self.campo_quantidade.value = "1"
        
        # Remove handlers antigos para evitar duplicação
        self.botao_salvar.on_click = None
        self.botao_cancelar.on_click = None

        # Configura os handlers dos botões
        def salvar(e):
            try:
                dados = {
                    "nome": self.campo_nome.value.strip(),
                    "quantidade": self.campo_quantidade.value
                }
                
                if not dados["nome"]:
                    raise ValueError("Nome do produto é obrigatório")
                
                if not dados["quantidade"] or int(dados["quantidade"]) <= 0:
                    raise ValueError("Quantidade deve ser um número positivo")
                
                if callable(on_salvar):
                    on_salvar(dados)
                    
                self.fechar()
                
            except ValueError as ve:
                self.page.snack_bar = ft.SnackBar(ft.Text(str(ve)))
                self.page.snack_bar.open = True
                self.page.update()

        def cancelar(e):
            if callable(on_cancelar):
                on_cancelar()
            self.fechar()

        # Atribui os novos handlers
        self.botao_salvar.on_click = salvar
        self.botao_cancelar.on_click = cancelar
        
        # Verifica se a página já tem um diálogo atribuído
        if not hasattr(self.page, 'dialog') or self.page.dialog != self.dialog:
            self.log.info('Entrou no if de não há dialogue')
            self.page.dialog = self.dialog
            self.log.debug(f'Dialogue : {self.page.dialog}' )
            
        # Abre o diálogo e atualiza a página
        self.dialog.open = True
        self.page.update()

    def fechar(self):
        """Fecha o diálogo"""
        self.dialog.open = False
        self.page.update()

    def verificar_visibilidade(self):
        """Verifica se o diálogo está visível na página"""
        if not hasattr(self.page, 'dialog'):
            return "Nenhum diálogo atribuído à página"
        
        if self.page.dialog != self.dialog:
            return "Diálogo errado atribuído à página"
        
        if not self.dialog.open:
            return "Diálogo não está aberto"
        
        return "Diálogo visível e aberto"