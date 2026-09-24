-- Seeds the Unit 1 ("The World in 1750") starter location set.
-- Run this once, after schema.sql. Safe to re-run — it clears and
-- re-inserts Unit 1's locations each time, so if you've edited them
-- from the Teacher Dashboard, re-running this will overwrite those edits.

do $$
declare
  v_unit_id int;
begin
  select id into v_unit_id from whp_units where unit_number = 1;

  delete from whp_unit_locations where unit_id = v_unit_id;

  insert into whp_unit_locations (unit_id, name, region, lat, lng, group_number, fun_fact) values
  (v_unit_id, 'Qing Empire', 'China', 35.0, 105.0, 1, 'The Qing Dynasty ruled the largest population of any state on Earth in 1750.'),
  (v_unit_id, 'Mughal Empire', 'South Asia', 25.0, 78.0, 1, 'By 1750 Mughal central authority was weakening, opening the door to regional powers and European trading companies.'),
  (v_unit_id, 'Tokugawa Japan', 'Japan', 36.0, 138.0, 1, 'Japan''s Tokugawa shogunate kept the country largely closed to outside trade and contact.'),
  (v_unit_id, 'Joseon Korea', 'Korea', 37.0, 127.5, 1, 'The Joseon dynasty governed a unified Korea for over 500 years, from 1392 to 1897.'),
  (v_unit_id, 'Ottoman Empire', 'Anatolia / Middle East', 39.0, 35.0, 1, 'The Ottoman Empire spanned three continents and controlled key trade routes between Europe and Asia.'),
  (v_unit_id, 'Konbaung Burma', 'Southeast Asia', 21.0, 96.0, 1, 'The Konbaung dynasty was founded in 1752 and went on to unify much of present-day Myanmar.'),

  (v_unit_id, 'Ashanti Empire', 'West Africa', 6.7, -1.6, 2, 'The Ashanti Empire grew wealthy through gold and its role in West African trade networks.'),
  (v_unit_id, 'Kingdom of Kongo', 'Central Africa', -5.5, 14.0, 2, 'Kongo had been in contact with Portugal since the late 1400s, one of the earliest sustained Europe-Africa exchanges.'),
  (v_unit_id, 'Sokoto / Hausa City-States', 'West Africa', 12.0, 8.0, 2, 'The Hausa city-states were major hubs of trans-Saharan trade in cloth, leather, and salt.'),
  (v_unit_id, 'Ethiopian Empire', 'East Africa', 9.0, 38.0, 2, 'Ethiopia''s Christian monarchy traced its roots back over a thousand years by 1750.'),
  (v_unit_id, 'Merina Kingdom', 'Madagascar', -19.0, 47.0, 2, 'The Merina Kingdom on Madagascar would unify the island in the decades after 1750.'),
  (v_unit_id, 'Funj Sultanate', 'Sudan / Nile Valley', 13.5, 33.5, 2, 'The Funj Sultanate controlled a key stretch of the Nile trade corridor between sub-Saharan and North Africa.'),

  (v_unit_id, 'Russian Empire', 'Eurasia', 60.0, 60.0, 3, 'By 1750 Russia stretched from Eastern Europe across Siberia, making it the largest territorial empire on Earth.'),
  (v_unit_id, 'Kingdom of France', 'Western Europe', 47.0, 2.0, 3, 'France held one of Europe''s most powerful monarchies and a large overseas colonial network in 1750.'),
  (v_unit_id, 'Thirteen British Colonies', 'North America', 40.0, -77.0, 3, 'The thirteen colonies were still decades away from declaring independence in 1750.'),
  (v_unit_id, 'New Spain', 'Mexico', 23.0, -102.0, 3, 'New Spain was the wealthiest of Spain''s American colonies, built on silver mining.'),
  (v_unit_id, 'Viceroyalty of Peru', 'South America', -12.0, -75.0, 3, 'Peru''s silver mines, especially at Potosi, helped fund Spain''s global empire.'),
  (v_unit_id, 'Portuguese Brazil', 'South America', -14.0, -51.0, 3, 'Brazil''s economy in 1750 relied heavily on enslaved labor in sugar and, increasingly, gold mining.');
end $$;
