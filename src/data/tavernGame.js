export const TAVERN_OPTIONS = {
  liquor: [
    {
      id: 'liquor-makgeolli',
      name: '새벽 숲 막걸리',
      description: '6도 · 은은한 단맛 · 가벼운 바디',
      emoji: '🍶',
    },
    {
      id: 'liquor-yakju',
      name: '달빛 약주',
      description: '15도 · 향긋함 · 깔끔한 여운',
      emoji: '🌙',
    },
    {
      id: 'liquor-strong',
      name: '고요 이슬',
      description: '32도 · 깊고 묵직한 풍미',
      emoji: '🥃',
    },
  ],

  food: [
    {
      id: 'food-tofu',
      name: '들기름 두부구이',
      description: '담백하고 가볍게 즐기는 안주',
      emoji: '🥢',
    },
    {
      id: 'food-yukjeon',
      name: '한우 육전',
      description: '고소하고 풍미가 깊은 안주',
      emoji: '🥩',
    },
    {
      id: 'food-tteokgalbi',
      name: '떡갈비',
      description: '달큰하고 묵직한 맛의 안주',
      emoji: '🍖',
    },
  ],

  glass: [
    {
      id: 'glass-white',
      name: '백자 잔',
      description: '단정하고 편안한 분위기',
      emoji: '🏺',
    },
    {
      id: 'glass-clear',
      name: '유리 잔',
      description: '깔끔하고 현대적인 분위기',
      emoji: '🥛',
    },
    {
      id: 'glass-brass',
      name: '유기 잔',
      description: '깊고 격식 있는 분위기',
      emoji: '✨',
    },
  ],
}


export const TAVERN_CUSTOMERS = [
  {
    id: 'customer-01',

    name: '퇴근한 손님',

    characterKey: 'man',

    dialogue: [
      '안녕하세요. 오늘 하루가 꽤 길었네요.',
      '너무 독한 술보다는 편하게 마실 수 있는 술이 좋겠어요.',
      '단맛은 은은하고, 부담 없이 즐길 수 있는 한상이면 좋겠네요.',
      '그럼 안쪽 자리에 앉아서 기다리고 있을게요.',
    ],

    request: [
      '낮은 도수',
      '은은한 단맛',
      '가벼운 한상',
    ],

    scores: {
      liquor: {
        'liquor-makgeolli': 30,
        'liquor-yakju': 18,
        'liquor-strong': 5,
      },

      food: {
        'food-tofu': 30,
        'food-yukjeon': 20,
        'food-tteokgalbi': 8,
      },

      glass: {
        'glass-white': 30,
        'glass-clear': 20,
        'glass-brass': 12,
      },
    },

    reactions: {
      high:
        '딱 제가 원하던 한상이네요. 오늘 하루가 편안하게 마무리되는 기분이에요!',

      medium:
        '생각보다 잘 어울리네요. 편하게 한잔하기 좋은 한상이에요.',

      low:
        '새로운 조합이긴 한데, 오늘 제 기분에는 조금 강한 것 같네요.',
    },
  },

  {
    id: 'customer-02',

    name: '풍미를 즐기는 손님',

    characterKey: 'woman',

    dialogue: [
      '안녕하세요. 오늘은 음식과 함께 천천히 술을 즐기고 싶어요.',
      '너무 가벼운 술보다는 향이 분명하고 적당한 도수가 좋습니다.',
      '술과 안주의 풍미가 잘 어우러지는 한상을 부탁드릴게요.',
      '저는 자리에 앉아서 기다리고 있겠습니다.',
    ],

    request: [
      '적당한 도수',
      '분명한 향',
      '음식과의 조화',
    ],

    scores: {
      liquor: {
        'liquor-makgeolli': 15,
        'liquor-yakju': 30,
        'liquor-strong': 12,
      },

      food: {
        'food-tofu': 14,
        'food-yukjeon': 30,
        'food-tteokgalbi': 22,
      },

      glass: {
        'glass-white': 20,
        'glass-clear': 15,
        'glass-brass': 30,
      },
    },

    reactions: {
      high:
        '술과 안주가 정말 잘 어울리네요. 잔까지 분위기에 딱 맞아요!',

      medium:
        '괜찮은 조합이에요. 다음에는 다른 한상도 한번 경험해보고 싶네요.',

      low:
        '조금 아쉽지만 흥미로운 경험이었어요. 다음엔 제 취향을 더 잘 맞춰주세요!',
    },
  },
]