interface Quest {
  id: string;
  title: string;
  description: string;
  xp: number;
  icon: string;
  color: string;
  requirement: number;
  action?: () => void;
}

export interface QuestTier {
  tier: number;
  minLevel: number;
  quests: Quest[];
}

export const getQuestsForLevel = (userLevel: number): Quest[] => {
  const allQuests: Quest[] = [];

  if (userLevel >= 1) {
    allQuests.push(
      {
        id: 'checkin',
        title: 'Check-in quotidien',
        description: 'Partage tes émotions du jour',
        xp: 10,
        icon: 'Heart',
        color: 'from-rose-400 to-pink-500',
        requirement: 1
      },
      {
        id: 'journal',
        title: 'Journal',
        description: 'Écris dans ton journal',
        xp: 15,
        icon: 'BookOpen',
        color: 'from-amber-400 to-orange-500',
        requirement: 1
      },
      {
        id: 'meditation',
        title: 'Méditation (5 min)',
        description: 'Pratique 5 minutes de méditation',
        xp: 20,
        icon: 'Timer',
        color: 'from-purple-400 to-indigo-500',
        requirement: 5
      },
      {
        id: 'breathing',
        title: 'Respiration',
        description: 'Une session de respiration',
        xp: 10,
        icon: 'Wind',
        color: 'from-cyan-400 to-blue-500',
        requirement: 1
      }
    );
  }

  if (userLevel >= 2) {
    allQuests.push(
      {
        id: 'meditation-15',
        title: 'Méditation avancée (15 min)',
        description: 'Médite pendant 15 minutes',
        xp: 40,
        icon: 'Timer',
        color: 'from-purple-500 to-indigo-600',
        requirement: 15
      },
      {
        id: 'breathing-3',
        title: 'Respiration prolongée',
        description: '3 sessions de respiration',
        xp: 25,
        icon: 'Wind',
        color: 'from-cyan-500 to-blue-600',
        requirement: 3
      }
    );
  }

  if (userLevel >= 3) {
    allQuests.push(
      {
        id: 'meditation-30',
        title: 'Méditation profonde (30 min)',
        description: 'Médite pendant 30 minutes',
        xp: 80,
        icon: 'Timer',
        color: 'from-purple-600 to-indigo-700',
        requirement: 30
      },
      {
        id: 'journal-reflection',
        title: 'Journal approfondi',
        description: 'Écris 2 entrées de journal',
        xp: 30,
        icon: 'BookOpen',
        color: 'from-amber-500 to-orange-600',
        requirement: 2
      }
    );
  }

  if (userLevel >= 5) {
    allQuests.push(
      {
        id: 'meditation-60',
        title: 'Méditation maître (60 min)',
        description: 'Médite pendant 1 heure',
        xp: 150,
        icon: 'Timer',
        color: 'from-purple-700 to-indigo-800',
        requirement: 60
      },
      {
        id: 'daily-mastery',
        title: 'Maîtrise quotidienne',
        description: 'Complète toutes les quêtes de base',
        xp: 50,
        icon: 'Star',
        color: 'from-yellow-400 to-amber-500',
        requirement: 4
      }
    );
  }

  return allQuests;
};

export const groupQuestsByTier = (userLevel: number): QuestTier[] => {
  const tiers: QuestTier[] = [
    {
      tier: 1,
      minLevel: 1,
      quests: []
    },
    {
      tier: 2,
      minLevel: 2,
      quests: []
    },
    {
      tier: 3,
      minLevel: 3,
      quests: []
    },
    {
      tier: 4,
      minLevel: 5,
      quests: []
    }
  ];

  const allQuests = getQuestsForLevel(userLevel);

  allQuests.forEach(quest => {
    if (quest.id.includes('meditation-60') || quest.id === 'daily-mastery') {
      tiers[3].quests.push(quest);
    } else if (quest.id.includes('meditation-30') || quest.id === 'journal-reflection') {
      tiers[2].quests.push(quest);
    } else if (quest.id.includes('-15') || quest.id.includes('-3')) {
      tiers[1].quests.push(quest);
    } else {
      tiers[0].quests.push(quest);
    }
  });

  return tiers.filter(tier => tier.quests.length > 0 && userLevel >= tier.minLevel);
};

export const getMaxDailyXP = (userLevel: number): number => {
  const quests = getQuestsForLevel(userLevel);
  return quests.reduce((sum, quest) => sum + quest.xp, 0);
};
