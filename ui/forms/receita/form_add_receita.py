from typing import Any, Dict, List
import flet as ft

class ReceitaForm:
    def __init__(self):
        self._setup_campos_receita()
    
    def _setup_campos_receita(self):
        
        self.campo_id = ft.TextField(label="ID", disabled=True, visible=False)
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

        self.descricao = ft.TextField(
            label="Descrição",
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
    
    def get_campos(self) -> List[ft.Control]:
        return [
            self.campo_id,
            self.campo_nome,
            ft.Row([self.campo_categoria, self.campo_dificuldade]),
            ft.Row([self.campo_tempo, self.campo_rendimento]),
            self.campo_modo_preparo,
            ft.Divider(),
            self.descricao


        ]
    
    def get_valores(self) -> Dict[str, Any]:
        return {
            "id": self.campo_id.value if self.campo_id.visible else None,
            "nome": self.campo_nome.value.strip(),
            "categoria": self.campo_categoria.value,
            "modo_preparo": self.campo_modo_preparo.value.strip(),
            "descricao":self.descricao.value.strip(),
            "tempo": int(self.campo_tempo.value) if self.campo_tempo.value else 0,
            "rendimento": float(self.campo_rendimento.value) if self.campo_rendimento.value else 0,
            "dificuldade": self.campo_dificuldade.value
        }
    
    def preencher_campos(self, receita: Dict[str, Any]):
        self.campo_id.value = str(receita.get("id", ""))
        self.campo_id.visible = True
        self.campo_nome.value = receita.get("nome", "")
        self.campo_categoria.value = receita.get("categoria", "")
        self.campo_modo_preparo.value = receita.get("modo_preparo", "")
        self.descricao.value = receita.get("descricao", "")
        self.campo_tempo.value = str(receita.get("tempo", ""))
        self.campo_rendimento.value = str(receita.get("rendimento", ""))
        self.campo_dificuldade.value = receita.get("dificuldade", "facil")
    
    def limpar_campos(self):
        self.campo_id.value = ""
        self.campo_id.visible = False
        self.campo_nome.value = ""
        self.campo_categoria.value = ""
        self.campo_modo_preparo.value = ""
        self.descricao.value = ""
        self.campo_tempo.value = ""
        self.campo_rendimento.value = ""
        self.campo_dificuldade.value = "facil"