from dataclasses import dataclass, field

@dataclass
class Produto:
    _id: int = field(default=None, repr=False)
    _nome: str = field(default='', repr=False)
    _descricao: str = field(default='', repr=False)
    _preco: float = field(default=0.0, repr=False)
    _quantidade: int = field(default=0, repr=False)
    _tipo: str = field(default='unidade', repr=False)

    TIPOS_VALIDOS = {'unidade', 'kg', 'litro', 'pacote', 'caixa'}

    def __post_init__(self):
        # Chamamos os setters para forçar validação ao criar
        self.id = self._id
        self.nome = self._nome
        self.descricao = self._descricao
        self.preco = self._preco
        self.quantidade = self._quantidade
        self.tipo = self._tipo

    # ID
    @property
    def id(self):
        return self._id

    @id.setter
    def id(self, valor):
        if valor is not None and not isinstance(valor, int):
            raise TypeError("ID deve ser um inteiro ou None.")
        self._id = valor

    # Nome
    @property
    def nome(self):
        return self._nome

    @nome.setter
    def nome(self, valor):
        if not isinstance(valor, str):
            raise TypeError("Nome deve ser uma string.")
        if not valor.strip():
            raise ValueError("Nome não pode ser vazio.")
        self._nome = valor.strip()

    # Descrição
    @property
    def descricao(self):
        return self._descricao

    @descricao.setter
    def descricao(self, valor):
        if not isinstance(valor, str):
            raise TypeError("Descrição deve ser uma string.")
        self._descricao = valor.strip()

    # Preço
    @property
    def preco(self):
        return self._preco

    @preco.setter
    def preco(self, valor):
        if not isinstance(valor, (int, float)):
            raise TypeError("Preço deve ser um número.")
        if valor < 0:
            raise ValueError("Preço não pode ser negativo.")
        self._preco = float(valor)

    # Quantidade
    @property
    def quantidade(self):
        return self._quantidade

    @quantidade.setter
    def quantidade(self, valor):
        if not isinstance(valor, int):
            raise TypeError("Quantidade deve ser um inteiro.")
        if valor < 0:
            raise ValueError("Quantidade não pode ser negativa.")
        self._quantidade = valor

    # Tipo
    @property
    def tipo(self):
        return self._tipo

    @tipo.setter
    def tipo(self, valor):
        if not isinstance(valor, str):
            raise TypeError("Tipo deve ser uma string.")
        if valor.lower() not in self.TIPOS_VALIDOS:
            raise ValueError(f"Tipo inválido. Tipos válidos: {', '.join(self.TIPOS_VALIDOS)}.")
        self._tipo = valor.lower()
