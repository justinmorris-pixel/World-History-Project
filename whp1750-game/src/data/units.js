// Course structure follows the OER Project "World History 1750" course
// (9 units, Industrial Revolution to present). Each unit gets its own
// curated set of map locations relevant to that era. Only Unit 1 is
// pre-populated here as a starter set — teachers add/edit the rest from
// the dashboard, or you can extend this file directly and re-seed.

export const UNITS = [
  { unit_number: 1, title: 'The World in 1750', years: '— 1750 CE' },
  { unit_number: 2, title: 'Liberal and National Revolutions', years: '1750 – 1850 CE' },
  { unit_number: 3, title: 'Industrialization', years: '1750 – 1900 CE' },
  { unit_number: 4, title: 'Reform Movements', years: '1750 – 1900 CE' },
  { unit_number: 5, title: 'Industrial Empires', years: '1750 – 1914 CE' },
  { unit_number: 6, title: 'World War I', years: '1914 – 1919 CE' },
  { unit_number: 7, title: 'Interwar and World War II', years: '1919 – 1945 CE' },
  { unit_number: 8, title: 'Cold War and Decolonization', years: '1945 – 1991 CE' },
  { unit_number: 9, title: 'Globalization', years: '1900 CE – present' },
]

// group_number controls progressive unlock within a unit, same pattern as
// County Quest's county groups: students must master group 1 before group 2
// unlocks, and so on.
export const UNIT_1_LOCATIONS = [
  // Group 1 — Asia
  { name: 'Qing Empire', region: 'China', lat: 35.0, lng: 105.0, group_number: 1,
    fun_fact: 'The Qing Dynasty ruled the largest population of any state on Earth in 1750.' },
  { name: 'Mughal Empire', region: 'South Asia', lat: 25.0, lng: 78.0, group_number: 1,
    fun_fact: 'By 1750 Mughal central authority was weakening, opening the door to regional powers and European trading companies.' },
  { name: 'Tokugawa Japan', region: 'Japan', lat: 36.0, lng: 138.0, group_number: 1,
    fun_fact: 'Japan\'s Tokugawa shogunate kept the country largely closed to outside trade and contact.' },
  { name: 'Joseon Korea', region: 'Korea', lat: 37.0, lng: 127.5, group_number: 1,
    fun_fact: 'The Joseon dynasty governed a unified Korea for over 500 years, from 1392 to 1897.' },
  { name: 'Ottoman Empire', region: 'Anatolia / Middle East', lat: 39.0, lng: 35.0, group_number: 1,
    fun_fact: 'The Ottoman Empire spanned three continents and controlled key trade routes between Europe and Asia.' },
  { name: 'Konbaung Burma', region: 'Southeast Asia', lat: 21.0, lng: 96.0, group_number: 1,
    fun_fact: 'The Konbaung dynasty was founded in 1752 and went on to unify much of present-day Myanmar.' },

  // Group 2 — Africa
  { name: 'Ashanti Empire', region: 'West Africa', lat: 6.7, lng: -1.6, group_number: 2,
    fun_fact: 'The Ashanti Empire grew wealthy through gold and its role in West African trade networks.' },
  { name: 'Kingdom of Kongo', region: 'Central Africa', lat: -5.5, lng: 14.0, group_number: 2,
    fun_fact: 'Kongo had been in contact with Portugal since the late 1400s, one of the earliest sustained Europe–Africa exchanges.' },
  { name: 'Sokoto / Hausa City-States', region: 'West Africa', lat: 12.0, lng: 8.0, group_number: 2,
    fun_fact: 'The Hausa city-states were major hubs of trans-Saharan trade in cloth, leather, and salt.' },
  { name: 'Ethiopian Empire', region: 'East Africa', lat: 9.0, lng: 38.0, group_number: 2,
    fun_fact: 'Ethiopia\'s Christian monarchy traced its roots back over a thousand years by 1750.' },
  { name: 'Merina Kingdom', region: 'Madagascar', lat: -19.0, lng: 47.0, group_number: 2,
    fun_fact: 'The Merina Kingdom on Madagascar would unify the island in the decades after 1750.' },
  { name: 'Funj Sultanate', region: 'Sudan / Nile Valley', lat: 13.5, lng: 33.5, group_number: 2,
    fun_fact: 'The Funj Sultanate controlled a key stretch of the Nile trade corridor between sub-Saharan and North Africa.' },

  // Group 3 — Europe & the Americas
  { name: 'Russian Empire', region: 'Eurasia', lat: 60.0, lng: 60.0, group_number: 3,
    fun_fact: 'By 1750 Russia stretched from Eastern Europe across Siberia, making it the largest territorial empire on Earth.' },
  { name: 'Kingdom of France', region: 'Western Europe', lat: 47.0, lng: 2.0, group_number: 3,
    fun_fact: 'France held one of Europe\'s most powerful monarchies and a large overseas colonial network in 1750.' },
  { name: 'Thirteen British Colonies', region: 'North America', lat: 40.0, lng: -77.0, group_number: 3,
    fun_fact: 'The thirteen colonies were still decades away from declaring independence in 1750.' },
  { name: 'New Spain', region: 'Mexico', lat: 23.0, lng: -102.0, group_number: 3,
    fun_fact: 'New Spain was the wealthiest of Spain\'s American colonies, built on silver mining.' },
  { name: 'Viceroyalty of Peru', region: 'South America', lat: -12.0, lng: -75.0, group_number: 3,
    fun_fact: 'Peru\'s silver mines, especially at Potosí, helped fund Spain\'s global empire.' },
  { name: 'Portuguese Brazil', region: 'South America', lat: -14.0, lng: -51.0, group_number: 3,
    fun_fact: 'Brazil\'s economy in 1750 relied heavily on enslaved labor in sugar and, increasingly, gold mining.' },
]
