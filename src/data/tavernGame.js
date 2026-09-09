export const TAVERN_CUSTOMERS = [
  {
    id: 1,

    name: '퇴근한 손님',

    character: 'customer01',

    intro: '오늘은 하루가 꽤 길었네요. 너무 독하지 않고 편하게 마실 수 있는 술이 좋겠어요.',

    preferences: {
      liquor: {
        'liquor-01': 30,
        'liquor-02': 20,
        'liquor-03': 5,
      },

      food: {
        'food-01': 30,
        'food-02': 15,
        'food-03': 10,
      },

      glass: {
        'glass-01': 20,
        'glass-02': 30,
        'glass-03': 10,
      },
    },

    reactions: {
      high: '딱 제가 찾던 한상이네요. 편하게 즐기기 좋겠어요!',
      medium: '괜찮네요. 생각보다 잘 어울리는 것 같아요.',
      low: '음... 오늘 제 기분에는 조금 강한 것 같네요.',
    },
  },

  {
    id: 2,

    name: '전통주 입문 손님',

    character: 'customer02',

    intro: '전통주는 처음이라 어떤 걸 골라야 할지 모르겠어요. 부담 없이 시작하고 싶어요.',

    preferences: {
      liquor: {
        'liquor-01': 30,
        'liquor-02': 15,
        'liquor-03': 5,
      },

      food: {
        'food-01': 20,
        'food-02': 30,
        'food-03': 15,
      },

      glass: {
        'glass-01': 30,
        'glass-02': 20,
        'glass-03': 10,
      },
    },

    reactions: {
      high: '전통주가 생각보다 어렵지 않네요! 다음에도 마셔보고 싶어요.',
      medium: '이런 조합도 있군요. 재미있어요!',
      low: '조금 어렵긴 하지만 새로운 경험이었어요.',
    },
  },
]