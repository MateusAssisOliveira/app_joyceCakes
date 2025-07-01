from typing import Optional, TypedDict


class IngredienteData(TypedDict):
    nome_produto: str
    simbolo: Optional[str]
    # outros campos podem ser adicionados conforme necessário