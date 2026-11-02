// Практичне · картка учасника. Тести готові — пиши код, поки всі не стануть зеленими.
// Запуск: npm run test:hw
import { TestBed } from '@angular/core/testing';
import { Participant } from '@app/models/group-orders/participant.model';
import { ParticipantCardComponent } from './participant-card.component';

const OLENA: Participant = {
  id: 'olena',
  type: 'Guest',
  name: 'Olena',
  isSubmitted: false,
  total: 440,
  items: [{ dish: { id: 'dish2', name: 'Tom Yum', price: 220, imageUrl: 'assets/img/dishes/spring-salad.jpg' }, quantity: 2 }],
};
const OWNER: Participant = { id: 'owner', type: 'Owner', name: 'Yevhenii', isSubmitted: true, total: 0, items: [] };

function render(participant: Participant): HTMLElement {
  const fixture = TestBed.createComponent(ParticipantCardComponent);
  fixture.componentRef.setInput('participant', participant); // так у тесті передаємо input
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('Практичне · картка учасника', () => {
  describe('крок 1 · заголовок картки', () => {
    it('гість: <h2> «Guest: Olena»', () => {
      expect(render(OLENA).querySelector('h2')?.textContent).toContain('Guest: Olena');
    });

    it('власник: <h2> «Owner: Yevhenii»', () => {
      expect(render(OWNER).querySelector('h2')?.textContent).toContain('Owner: Yevhenii');
    });

    it('власна картка на екрані Owner Review підписана «My Pre-Order»', () => {
      const fixture = TestBed.createComponent(ParticipantCardComponent);
      fixture.componentRef.setInput('participant', OWNER);
      fixture.componentRef.setInput('isOwnerOrder', true);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('h2')?.textContent).toContain('My Pre-Order');
    });
  });

  describe('крок 3 · страви і Subtotal', () => {
    it('показує назву страви, кількість і ціну × кількість через currency', () => {
      const text = render(OLENA).textContent ?? '';
      expect(text).toContain('Tom Yum');
      expect(text).toContain('2');
      expect(text).toContain('$440.00');
    });

    it('показує Subtotal учасника', () => {
      expect(render(OLENA).textContent).toContain('Subtotal');
    });

    it('порожній кошик: «No dishes yet»', () => {
      expect(render(OWNER).textContent).toContain('No dishes yet');
    });

    it('фото страви має розмір 40×40', () => {
      const img = render(OLENA).querySelector('img');
      expect(img?.getAttribute('width')).toBe('40');
      expect(img?.getAttribute('height')).toBe('40');
    });

    it('підбирає локальне фото лише коли відповідний asset існує', () => {
      const springSalad: Participant = {
        ...OLENA,
        items: [{ dish: { id: 'dish-spring', name: 'Spring Salad', price: 12 }, quantity: 1 }],
      };
      const fallbackDish: Participant = {
        ...OLENA,
        items: [{ dish: { id: 'unknown-dish', name: 'Dish from API', price: 12 }, quantity: 1 }],
      };

      expect(render(springSalad).querySelector('img')?.getAttribute('src'))
        .toBe('assets/img/dishes/spring-salad.jpg');
      expect(render(fallbackDish).querySelector('img')).toBeNull();
      expect(render(fallbackDish).textContent).toContain('Dish from API');
      expect(render(fallbackDish).querySelector('.initial')?.textContent?.trim()).toBe('D');
    });

    it('broken image reveals the dish initial instead of a broken-image icon', () => {
      const element = render(OLENA);
      const image = element.querySelector('img')!;

      image.dispatchEvent(new Event('error'));

      expect(image.hidden).toBeTrue();
      expect(element.querySelector('.initial')?.textContent?.trim()).toBe('T');
      expect(element.textContent).toContain('Tom Yum');
    });
  });

  describe('крок 4 · статус кошика текстом', () => {
    it('«Still choosing», якщо кошик не підтверджений', () => {
      expect(render(OLENA).textContent).toContain('Still choosing');
    });

    it('«Submitted», якщо підтверджений', () => {
      expect(render({ ...OLENA, isSubmitted: true }).textContent).toContain('Submitted');
    });

    it('does not show guest submission status on the Owner card', () => {
      expect(render(OWNER).textContent).not.toContain('Still choosing');
      expect(render(OWNER).textContent).not.toContain('Submitted');
    });
  });
});
