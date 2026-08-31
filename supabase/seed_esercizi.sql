-- Libreria esercizi di partenza, ricavata dalla scheda di ricomposizione.
-- Esegui DOPO schema.sql. I link video sono ricerche YouTube: sostituiscili
-- con i tuoi video quando li hai, dal pannello Esercizi dell'app.

insert into public.exercises (name, muscle_group, video_url, cues) values
('Goblet squat',              'Quadricipiti', 'https://www.youtube.com/results?search_query=goblet+squat+tecnica', 'Scendere fino a coscia parallela, senza rimbalzare in basso'),
('Leg press',                 'Quadricipiti', 'https://www.youtube.com/results?search_query=leg+press+tecnica', 'Non bloccare le ginocchia in alto, schiena aderente allo schienale'),
('Affondi in camminata',      'Quadricipiti', 'https://www.youtube.com/results?search_query=affondi+camminata+tecnica', 'Busto leggermente inclinato in avanti = più glutei'),
('Bulgarian split squat',     'Glutei',       'https://www.youtube.com/results?search_query=bulgarian+split+squat+tecnica', 'Piede posteriore rilassato, spinta col tallone davanti'),
('Hip thrust con bilanciere', 'Glutei',       'https://www.youtube.com/results?search_query=hip+thrust+bilanciere+tecnica', 'L''esercizio più importante della scheda. Mento verso il petto, pausa in alto'),
('Glute bridge',              'Glutei',       'https://www.youtube.com/results?search_query=glute+bridge+tecnica', 'Spinta dai talloni, costole basse'),
('Leg extension',             'Quadricipiti', 'https://www.youtube.com/results?search_query=leg+extension+tecnica', 'Pausa di 1 secondo in massima contrazione'),
('Abduzioni ai cavi',         'Glutei',       'https://www.youtube.com/results?search_query=abduzioni+cavi+glute+medio', 'Glute medio: dà la forma laterale al fianco'),
('Abduzioni alla macchina',   'Glutei',       'https://www.youtube.com/results?search_query=macchina+abduttori+tecnica', 'Busto leggermente in avanti per colpire meglio il gluteo medio'),
('Plank',                     'Core',         'https://www.youtube.com/results?search_query=plank+tecnica+corretta', 'Bacino in linea, non sollevato'),
('Lat machine presa larga',   'Dorso',        'https://www.youtube.com/results?search_query=lat+machine+presa+larga+tecnica', 'Tirare conducendo il gomito, non con la mano'),
('Chest press',               'Petto',        'https://www.youtube.com/results?search_query=chest+press+tecnica', 'Scapole raccolte e ferme'),
('Panca piana con manubri',   'Petto',        'https://www.youtube.com/results?search_query=panca+manubri+tecnica', 'Discesa controllata, gomiti a 45 gradi'),
('Rematore con manubrio',     'Dorso',        'https://www.youtube.com/results?search_query=rematore+manubrio+tecnica', 'Schiena ferma, si muove solo il braccio'),
('Pulley basso',              'Dorso',        'https://www.youtube.com/results?search_query=pulley+basso+tecnica', 'Petto alto, non dondolare col busto'),
('Alzate laterali',           'Spalle',       'https://www.youtube.com/results?search_query=alzate+laterali+tecnica', 'Carichi leggeri, movimento pulito senza slanci'),
('Curl bicipiti',             'Braccia',      'https://www.youtube.com/results?search_query=curl+bicipiti+tecnica', 'Gomiti fermi lungo il busto'),
('Push down tricipiti',       'Braccia',      'https://www.youtube.com/results?search_query=push+down+tricipiti+tecnica', 'In superset col curl, recupero solo alla fine'),
('Dead bug',                  'Core',         'https://www.youtube.com/results?search_query=dead+bug+esercizio', 'Zona lombare sempre a contatto col pavimento'),
('Stacco rumeno',             'Femorali',     'https://www.youtube.com/results?search_query=stacco+rumeno+tecnica', 'Schiena neutra, si deve sentire dietro la coscia'),
('Leg curl sdraiato',         'Femorali',     'https://www.youtube.com/results?search_query=leg+curl+sdraiato+tecnica', 'Discesa controllata in 3 secondi'),
('Leg curl seduto',           'Femorali',     'https://www.youtube.com/results?search_query=leg+curl+seduto+tecnica', 'Discesa controllata in 3 secondi'),
('Step up su panca',          'Glutei',       'https://www.youtube.com/results?search_query=step+up+panca+tecnica', 'Spingere col tallone della gamba sopra'),
('Calf raise in piedi',       'Polpacci',     'https://www.youtube.com/results?search_query=calf+raise+in+piedi+tecnica', 'Da non saltare: il polpaccio è la pompa venosa della gamba'),
('Camminata inclinata',       'Cardio',       'https://www.youtube.com/results?search_query=camminata+inclinata+tapis+roulant', 'Inclinazione 8-10%, passo comodo')
on conflict do nothing;
