import type { Lesson } from '../types';

/**
 * Camada pedagogica.
 *
 * Esta e a razao de o jogo existir. Sem ela o Cap4Kids e so uma fazendinha.
 *
 * A regra e: nunca explicar no vazio. Uma licao so aparece quando o jogador
 * acabou de causar o efeito com as proprias maos, porque e nesse momento que a
 * explicacao gruda. Cada licao tem um `id` para nao repetir a mesma varias
 * vezes, e um `concept` para o Diario agrupar depois.
 */

export type ConceptId =
  | 'supply-demand'
  | 'inflation'
  | 'compound-interest'
  | 'profit'
  | 'opportunity-cost';

export const CONCEPT_LABELS: Record<ConceptId, string> = {
  'supply-demand': 'Oferta e procura',
  inflation: 'Inflação',
  'compound-interest': 'Juros compostos',
  profit: 'Lucro e prejuízo',
  'opportunity-cost': 'Custo de oportunidade',
};

export class PedagogySystem {
  private seen = new Set<string>();

  private make(id: string, concept: ConceptId, title: string, body: string): Lesson | null {
    if (this.seen.has(id)) return null;
    this.seen.add(id);
    return { id, concept, title, body };
  }

  /** Disparada logo apos uma venda. */
  onSale(saturation: number, quantity: number, priceBefore: number, priceAfter: number): Lesson | null {
    if (priceAfter < priceBefore) {
      return this.make(
        'price-dropped',
        'supply-demand',
        'Por que o preço caiu?',
        `Você vendeu ${quantity} de uma vez só. Quando aparece muita mercadoria ao mesmo tempo, ` +
          `quem compra pode escolher — e paga menos. O preço caiu de ${priceBefore} para ${priceAfter}. ` +
          'Espere alguns dias: o mercado vai absorver o estoque e o preço sobe de novo.',
      );
    }
    if (saturation < 0.15 && quantity > 0) {
      return this.make(
        'sold-scarce',
        'supply-demand',
        'Vendeu na hora certa',
        'O mercado estava vazio desse produto, então quem compra pagou bem. ' +
          'Vender pouco de cada vez, quando falta, costuma render mais que despejar tudo junto.',
      );
    }
    return null;
  }

  /** Disparada quando a inflacao acumulada cruza marcos. */
  onInflation(accumulatedPercent: number): Lesson | null {
    if (accumulatedPercent >= 25) {
      return this.make(
        'inflation-25',
        'inflation',
        'Suas moedas encolheram',
        'Os preços subiram 25% desde o dia 1. O que custava 100 agora custa 125. ' +
          'Se o seu dinheiro não cresceu na mesma medida, você ficou mais pobre mesmo com o ' +
          'mesmo número de moedas no bolso. Isso se chama inflação.',
      );
    }
    if (accumulatedPercent >= 10) {
      return this.make(
        'inflation-10',
        'inflation',
        'Repare nos custos',
        'A semente e a despesa da casa estão mais caras que no começo. ' +
          'Os preços da fazenda sobem um pouquinho todo dia. Guardar moeda parada ' +
          'faz ela valer menos com o tempo.',
      );
    }
    return null;
  }

  /** Disparada quando os juros da divida ficam visiveis. */
  onInterest(debt: number, interest: number, totalPaid: number): Lesson | null {
    if (totalPaid >= 60) {
      return this.make(
        'interest-compounding',
        'compound-interest',
        'A dívida está crescendo sozinha',
        `Você já pagou ${totalPaid} moedas só de juros — sem ter comprado nada com isso. ` +
          'Os juros incidem sobre a dívida inteira, então quanto maior ela fica, mais rápido cresce. ' +
          'Abater um pouco agora custa bem menos do que abater tudo depois.',
      );
    }
    if (interest > 0 && debt > 0) {
      return this.make(
        'interest-first',
        'compound-interest',
        'De onde veio esse valor a mais?',
        `Sua dívida aumentou ${interest} moedas hoje sem você gastar nada. ` +
          'Isso são os juros: o preço de ficar devendo. Todo dia que a dívida continua de pé, ela cresce.',
      );
    }
    return null;
  }

  /** Disparada no fechamento do dia. */
  onDayClose(revenue: number, expenses: number): Lesson | null {
    if (revenue > 0 && expenses > revenue) {
      return this.make(
        'first-loss',
        'profit',
        'Você teve prejuízo hoje',
        `Entrou ${revenue} e saiu ${expenses}. Vender não basta: se o que você gasta para produzir ` +
          'for maior que o que recebe, a fazenda perde dinheiro. Lucro é o que sobra depois de pagar tudo.',
      );
    }
    if (revenue > expenses && revenue > 0) {
      return this.make(
        'first-profit',
        'profit',
        'Primeiro dia no lucro',
        `Entrou ${revenue} e saiu ${expenses}. A diferença é o seu lucro. ` +
          'É com ele que dá para pagar a dívida ou investir em algo que aumente a produção.',
      );
    }
    return null;
  }

  load(seen?: string[]): void {
    if (Array.isArray(seen)) this.seen = new Set(seen);
  }

  serialize(): string[] {
    return [...this.seen];
  }
}
