from typing import Dict, Any

from ui.forms.produto.produto_form_fields import ProdutoFormFields

class ProdutoFormController:
    def __init__(self, fields: ProdutoFormFields):
        self.fields = fields

    def preencher(self, dados: Dict[str, Any]):
        self.fields.id.value = str(dados.get("id", ""))
        self.fields.nome.value = dados.get("nome", "")
        self.fields.descricao.value = dados.get("descricao", "")
        self.fields.preco.value = str(dados.get("custo_unitario", "0"))
        self.fields.estoque_minimo.value = str(dados.get("estoque_minimo", "1"))
        self.fields.unidade_medida.value = str(dados.get("unidade_medida_id", ""))
        self.fields.categoria.value = str(dados.get("categoria_id", ""))
        self.fields.ativo.value = bool(dados.get("ativo", 1))

    def limpar(self):
        self.fields.id.value = ""
        self.fields.nome.value = ""
        self.fields.descricao.value = ""
        self.fields.preco.value = ""
        self.fields.estoque_minimo.value = "1"
        self.fields.unidade_medida.value = ""
        self.fields.categoria.value = ""
        self.fields.ativo.value = True

    def coletar(self) -> Dict[str, Any]:
        return {
            "id": self.fields.id.value or None,
            "nome": self.fields.nome.value.strip(),
            "descricao": self.fields.descricao.value.strip(),
            "custo_unitario": self._parse_float(self.fields.preco.value, "Preço"),
            "estoque_minimo": self._parse_float(self.fields.estoque_minimo.value, "Estoque mínimo"),
            "unidade_medida_id": self.fields.unidade_medida.value,
            "categoria_id": self.fields.categoria.value,
            "ativo": int(self.fields.ativo.value),
        }

    def _parse_float(self, valor: str, campo: str) -> float:
        try:
            return float(valor.replace(",", "."))
        except ValueError:
            raise ValueError(f"{campo} inválido.")
