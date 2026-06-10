export type Registro = {
      nome: string;
      endereco: string;
};

export type EntradaIndice = {
      nome: string;
      endereco: string;
      offset: number;
};

export type CampoBusca = 'nome' | 'endereco';