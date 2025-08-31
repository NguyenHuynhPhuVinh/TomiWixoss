// src/logic/models/player.model.ts
import { CardInstance } from "@/types/game";
import { PlayerState } from "@/store/types";

export class Player {
  // Tất cả state của player được đóng gói ở đây
  public mainDeck: CardInstance[];
  public lrigDeck: CardInstance[];
  public lrigZone: (CardInstance | null)[];
  public lifeCloth: CardInstance[];
  public hand: CardInstance[];
  public signiZone: (CardInstance | null)[];
  public enerZone: CardInstance[];
  public trash: CardInstance[];
  public lrigTrash: CardInstance[];
  public checkZone: (CardInstance | null)[];
  public name: string; // Thêm tên để dễ debug

  constructor(initialState: PlayerState, name: string) {
    this.name = name;
    this.mainDeck = initialState.mainDeck;
    this.lrigDeck = initialState.lrigDeck;
    this.lrigZone = initialState.lrigZone;
    this.lifeCloth = initialState.lifeCloth;
    this.hand = initialState.hand;
    this.signiZone = initialState.signiZone;
    this.enerZone = initialState.enerZone;
    this.trash = initialState.trash;
    this.lrigTrash = initialState.lrigTrash;
    this.checkZone = initialState.checkZone;
  }

  // === CÁC PHƯƠNG THỨC ĐỂ THAY ĐỔI STATE AN TOÀN ===

  /**
   * Rút một số lượng bài nhất định từ Main Deck vào Hand.
   * @param amount Số lá bài cần rút.
   * @returns Mảng các lá bài đã được rút.
   */
  public drawCards(amount: number): CardInstance[] {
    const drawnCards: CardInstance[] = [];
    for (let i = 0; i < amount && this.mainDeck.length > 0; i++) {
      const card = this.mainDeck.pop()!;
      card.isFaceUp = true;
      this.hand.push(card);
      drawnCards.push(card);
    }
    return drawnCards;
  }

  /**
   * Đặt một lá SIGNI từ tay ra sân.
   * @param cardUuid - UUID của lá bài trên tay.
   * @param zoneIndex - Vị trí trên sân (0, 1, hoặc 2).
   * @returns Lá bài đã được đặt ra sân, hoặc null nếu thất bại.
   */
  public placeSigniFromHand(
    cardUuid: string,
    zoneIndex: number
  ): CardInstance | null {
    const cardIndex = this.hand.findIndex((c) => c.uuid === cardUuid);
    if (cardIndex === -1 || this.signiZone[zoneIndex] !== null) {
      return null;
    }
    const cardToPlay = this.hand.splice(cardIndex, 1)[0];
    cardToPlay.isFaceUp = true;
    this.signiZone[zoneIndex] = cardToPlay;
    return cardToPlay;
  }

  /**
   * Chuyển một lá bài từ tay vào Ener Zone.
   * @param cardUuid - UUID của lá bài trên tay.
   * @returns Lá bài đã được nạp, hoặc null nếu thất bại.
   */
  public chargeEnerFromHand(cardUuid: string): CardInstance | null {
    const cardIndex = this.hand.findIndex((c) => c.uuid === cardUuid);
    if (cardIndex === -1) return null;

    const cardToCharge = this.hand.splice(cardIndex, 1)[0];
    cardToCharge.isFaceUp = true;
    this.enerZone.push(cardToCharge);
    return cardToCharge;
  }

  /**
   * Chuyển một lá SIGNI từ sân vào Ener Zone.
   * @param zoneIndex - Vị trí của SIGNI trên sân.
   * @returns Lá bài đã được nạp, hoặc null nếu thất bại.
   */
  public chargeEnerFromSigni(zoneIndex: number): CardInstance | null {
    const cardToCharge = this.signiZone[zoneIndex];
    if (!cardToCharge) return null;

    this.signiZone[zoneIndex] = null;
    cardToCharge.isFaceUp = true;
    this.enerZone.push(cardToCharge);
    return cardToCharge;
  }

  /**
   * "Up" tất cả các lá bài trên sân.
   * (Sẽ được mở rộng để xử lý "Freeze" sau này)
   */
  public upAllCards(): void {
    const upCard = (card: CardInstance | null) => {
      if (card) card.isDowned = false;
      return card;
    };
    this.signiZone.forEach(upCard);
    this.lrigZone.forEach(upCard);
  }
}
