(() => {
  const db = window.misarteSupabase;
  const clientId = new URLSearchParams(location.search).get("id");
  const BUCKET = "clientes";
  const MAX_SIZE = 5 * 1024 * 1024;
  const allowed = ["image/png","image/jpeg","image/webp"];
  const $ = s => document.querySelector(s);
  const el = {
    loader:$("#pageLoader"), app:$("#dashboardApp"), email:$("#userEmail"), logout:$("#logoutButton"),
    menu:$("#menuButton"), sidebar:$(".sidebar"), name:$("#clientName"), warning:$("#setupWarning"),
    form:$("#appearanceForm"), save:$("#saveButton"), preview:$("#previewFrame"), previewTop:$("#previewTop"),
    identity:$("#identityTab"), catalogs:$("#catalogsTab"), back:$("#backLink"), toast:$("#toast"),
    tema:$("#tema"), fonte:$("#fonte"), destaque:$("#catalogoDestaque"),
    fontPickerButton:$("#fontPickerButton"), fontLibrary:$("#fontLibrary"), fontSearch:$("#fontSearch"),
    fontCategories:$("#fontCategories"), fontGrid:$("#fontGrid"), fontEmpty:$("#fontEmpty"),
    fontResultCount:$("#fontResultCount"), selectedFontName:$("#selectedFontName"), closeFontLibrary:$("#closeFontLibrary"),
    fontViewGrid:$("#fontViewGrid"), fontViewList:$("#fontViewList"),
    fontPreviewText:$("#fontPreviewText"), fontLivePreviewName:$("#fontLivePreviewName"), fontLivePreviewSample:$("#fontLivePreviewSample"),
    paletteGrid:$("#paletteGrid"), selectedPaletteName:$("#selectedPaletteName"),
    bannerInput:$("#bannerInput"), faviconInput:$("#faviconInput"),
    bannerPreview:$("#bannerPreview"), faviconPreview:$("#faviconPreview"),
    removeBanner:$("#removeBanner"), removeFavicon:$("#removeFavicon")
  };
  const colors = [
    ["corPrimaria","corPrimariaText","cor_primaria"],
    ["corSecundaria","corSecundariaText","cor_secundaria"],
    ["corTexto","corTextoText","cor_texto"],
    ["corBotao","corBotaoText","cor_botao"],
    ["corDestaque","corDestaqueText","cor_destaque"],
    ["corFundo","corFundoText","cor_fundo"]
  ];
  let current = {};

  const FONT_LIBRARY = [{"name":"DM Sans","category":"Modernas","tags":["modernas","dm sans"]},{"name":"Inter","category":"Modernas","tags":["modernas","inter"]},{"name":"Poppins","category":"Modernas","tags":["modernas","poppins"]},{"name":"Montserrat","category":"Modernas","tags":["modernas","montserrat"]},{"name":"Manrope","category":"Modernas","tags":["modernas","manrope"]},{"name":"Plus Jakarta Sans","category":"Modernas","tags":["modernas","plus jakarta sans"]},{"name":"Urbanist","category":"Modernas","tags":["modernas","urbanist"]},{"name":"Outfit","category":"Modernas","tags":["modernas","outfit"]},{"name":"Sora","category":"Modernas","tags":["modernas","sora"]},{"name":"Rubik","category":"Modernas","tags":["modernas","rubik"]},{"name":"Work Sans","category":"Modernas","tags":["modernas","work sans"]},{"name":"Figtree","category":"Modernas","tags":["modernas","figtree"]},{"name":"Geologica","category":"Modernas","tags":["modernas","geologica"]},{"name":"Onest","category":"Modernas","tags":["modernas","onest"]},{"name":"Albert Sans","category":"Modernas","tags":["modernas","albert sans"]},{"name":"Red Hat Display","category":"Modernas","tags":["modernas","red hat display"]},{"name":"Space Grotesk","category":"Modernas","tags":["modernas","space grotesk"]},{"name":"Instrument Sans","category":"Modernas","tags":["modernas","instrument sans"]},{"name":"Public Sans","category":"Modernas","tags":["modernas","public sans"]},{"name":"Epilogue","category":"Modernas","tags":["modernas","epilogue"]},{"name":"Playfair Display","category":"Elegantes","tags":["elegantes","playfair display"]},{"name":"Cormorant Garamond","category":"Elegantes","tags":["elegantes","cormorant garamond"]},{"name":"Bodoni Moda","category":"Elegantes","tags":["elegantes","bodoni moda"]},{"name":"Prata","category":"Elegantes","tags":["elegantes","prata"]},{"name":"Cinzel","category":"Elegantes","tags":["elegantes","cinzel"]},{"name":"Italiana","category":"Elegantes","tags":["elegantes","italiana"]},{"name":"Marcellus","category":"Elegantes","tags":["elegantes","marcellus"]},{"name":"DM Serif Display","category":"Elegantes","tags":["elegantes","dm serif display"]},{"name":"Fraunces","category":"Elegantes","tags":["elegantes","fraunces"]},{"name":"Cormorant","category":"Elegantes","tags":["elegantes","cormorant"]},{"name":"Cormorant Infant","category":"Elegantes","tags":["elegantes","cormorant infant"]},{"name":"Cormorant SC","category":"Elegantes","tags":["elegantes","cormorant sc"]},{"name":"Gilda Display","category":"Elegantes","tags":["elegantes","gilda display"]},{"name":"Forum","category":"Elegantes","tags":["elegantes","forum"]},{"name":"Bellefair","category":"Elegantes","tags":["elegantes","bellefair"]},{"name":"Arapey","category":"Elegantes","tags":["elegantes","arapey"]},{"name":"Tenor Sans","category":"Elegantes","tags":["elegantes","tenor sans"]},{"name":"Oranienbaum","category":"Elegantes","tags":["elegantes","oranienbaum"]},{"name":"Vidaloka","category":"Elegantes","tags":["elegantes","vidaloka"]},{"name":"Yeseva One","category":"Elegantes","tags":["elegantes","yeseva one"]},{"name":"Roboto","category":"Minimalistas","tags":["minimalistas","roboto"]},{"name":"Open Sans","category":"Minimalistas","tags":["minimalistas","open sans"]},{"name":"Lato","category":"Minimalistas","tags":["minimalistas","lato"]},{"name":"Source Sans 3","category":"Minimalistas","tags":["minimalistas","source sans 3"]},{"name":"Noto Sans","category":"Minimalistas","tags":["minimalistas","noto sans"]},{"name":"Mulish","category":"Minimalistas","tags":["minimalistas","mulish"]},{"name":"Karla","category":"Minimalistas","tags":["minimalistas","karla"]},{"name":"Cabin","category":"Minimalistas","tags":["minimalistas","cabin"]},{"name":"IBM Plex Sans","category":"Minimalistas","tags":["minimalistas","ibm plex sans"]},{"name":"Josefin Sans","category":"Minimalistas","tags":["minimalistas","josefin sans"]},{"name":"Quicksand","category":"Minimalistas","tags":["minimalistas","quicksand"]},{"name":"Nunito Sans","category":"Minimalistas","tags":["minimalistas","nunito sans"]},{"name":"Assistant","category":"Minimalistas","tags":["minimalistas","assistant"]},{"name":"Heebo","category":"Minimalistas","tags":["minimalistas","heebo"]},{"name":"Hind","category":"Minimalistas","tags":["minimalistas","hind"]},{"name":"Arimo","category":"Minimalistas","tags":["minimalistas","arimo"]},{"name":"Overpass","category":"Minimalistas","tags":["minimalistas","overpass"]},{"name":"Jost","category":"Minimalistas","tags":["minimalistas","jost"]},{"name":"Maven Pro","category":"Minimalistas","tags":["minimalistas","maven pro"]},{"name":"Questrial","category":"Minimalistas","tags":["minimalistas","questrial"]},{"name":"Lora","category":"Clássicas","tags":["clássicas","lora"]},{"name":"Merriweather","category":"Clássicas","tags":["clássicas","merriweather"]},{"name":"Crimson Text","category":"Clássicas","tags":["clássicas","crimson text"]},{"name":"EB Garamond","category":"Clássicas","tags":["clássicas","eb garamond"]},{"name":"Source Serif 4","category":"Clássicas","tags":["clássicas","source serif 4"]},{"name":"Noto Serif","category":"Clássicas","tags":["clássicas","noto serif"]},{"name":"Spectral","category":"Clássicas","tags":["clássicas","spectral"]},{"name":"Alegreya","category":"Clássicas","tags":["clássicas","alegreya"]},{"name":"Cardo","category":"Clássicas","tags":["clássicas","cardo"]},{"name":"Libre Baskerville","category":"Clássicas","tags":["clássicas","libre baskerville"]},{"name":"Vollkorn","category":"Clássicas","tags":["clássicas","vollkorn"]},{"name":"Old Standard TT","category":"Clássicas","tags":["clássicas","old standard tt"]},{"name":"PT Serif","category":"Clássicas","tags":["clássicas","pt serif"]},{"name":"Gentium Book Plus","category":"Clássicas","tags":["clássicas","gentium book plus"]},{"name":"Bitter","category":"Clássicas","tags":["clássicas","bitter"]},{"name":"Domine","category":"Clássicas","tags":["clássicas","domine"]},{"name":"Neuton","category":"Clássicas","tags":["clássicas","neuton"]},{"name":"Tinos","category":"Clássicas","tags":["clássicas","tinos"]},{"name":"Faustina","category":"Clássicas","tags":["clássicas","faustina"]},{"name":"Literata","category":"Clássicas","tags":["clássicas","literata"]},{"name":"Barlow","category":"Sans Serif","tags":["sans serif","barlow"]},{"name":"Barlow Semi Condensed","category":"Sans Serif","tags":["sans serif","barlow semi condensed"]},{"name":"Roboto Flex","category":"Sans Serif","tags":["sans serif","roboto flex"]},{"name":"Roboto Slab","category":"Sans Serif","tags":["sans serif","roboto slab"]},{"name":"Ubuntu","category":"Sans Serif","tags":["sans serif","ubuntu"]},{"name":"Exo 2","category":"Sans Serif","tags":["sans serif","exo 2"]},{"name":"Titillium Web","category":"Sans Serif","tags":["sans serif","titillium web"]},{"name":"Noto Sans Display","category":"Sans Serif","tags":["sans serif","noto sans display"]},{"name":"Noto Sans Thai","category":"Sans Serif","tags":["sans serif","noto sans thai"]},{"name":"Noto Sans JP","category":"Sans Serif","tags":["sans serif","noto sans jp"]},{"name":"Noto Sans KR","category":"Sans Serif","tags":["sans serif","noto sans kr"]},{"name":"Noto Sans Arabic","category":"Sans Serif","tags":["sans serif","noto sans arabic"]},{"name":"Lexend","category":"Sans Serif","tags":["sans serif","lexend"]},{"name":"Atkinson Hyperlegible","category":"Sans Serif","tags":["sans serif","atkinson hyperlegible"]},{"name":"Commissioner","category":"Sans Serif","tags":["sans serif","commissioner"]},{"name":"Readex Pro","category":"Sans Serif","tags":["sans serif","readex pro"]},{"name":"Schibsted Grotesk","category":"Sans Serif","tags":["sans serif","schibsted grotesk"]},{"name":"Archivo","category":"Sans Serif","tags":["sans serif","archivo"]},{"name":"Asap","category":"Sans Serif","tags":["sans serif","asap"]},{"name":"Catamaran","category":"Sans Serif","tags":["sans serif","catamaran"]},{"name":"Zilla Slab","category":"Serif","tags":["serif","zilla slab"]},{"name":"Bree Serif","category":"Serif","tags":["serif","bree serif"]},{"name":"Slabo 27px","category":"Serif","tags":["serif","slabo 27px"]},{"name":"Lusitana","category":"Serif","tags":["serif","lusitana"]},{"name":"Newsreader","category":"Serif","tags":["serif","newsreader"]},{"name":"Petrona","category":"Serif","tags":["serif","petrona"]},{"name":"Martel","category":"Serif","tags":["serif","martel"]},{"name":"Aleo","category":"Serif","tags":["serif","aleo"]},{"name":"Arvo","category":"Serif","tags":["serif","arvo"]},{"name":"Crete Round","category":"Serif","tags":["serif","crete round"]},{"name":"Rokkitt","category":"Serif","tags":["serif","rokkitt"]},{"name":"Noticia Text","category":"Serif","tags":["serif","noticia text"]},{"name":"Yrsa","category":"Serif","tags":["serif","yrsa"]},{"name":"Trirong","category":"Serif","tags":["serif","trirong"]},{"name":"Noto Serif Display","category":"Serif","tags":["serif","noto serif display"]},{"name":"Cormorant Unicase","category":"Serif","tags":["serif","cormorant unicase"]},{"name":"Libre Caslon Text","category":"Serif","tags":["serif","libre caslon text"]},{"name":"Libre Caslon Display","category":"Serif","tags":["serif","libre caslon display"]},{"name":"Inria Serif","category":"Serif","tags":["serif","inria serif"]},{"name":"Baskervville","category":"Serif","tags":["serif","baskervville"]},{"name":"Pacifico","category":"Cursivas","tags":["cursivas","pacifico"]},{"name":"Great Vibes","category":"Cursivas","tags":["cursivas","great vibes"]},{"name":"Dancing Script","category":"Cursivas","tags":["cursivas","dancing script"]},{"name":"Allura","category":"Cursivas","tags":["cursivas","allura"]},{"name":"Sacramento","category":"Cursivas","tags":["cursivas","sacramento"]},{"name":"Satisfy","category":"Cursivas","tags":["cursivas","satisfy"]},{"name":"Kaushan Script","category":"Cursivas","tags":["cursivas","kaushan script"]},{"name":"Parisienne","category":"Cursivas","tags":["cursivas","parisienne"]},{"name":"Yellowtail","category":"Cursivas","tags":["cursivas","yellowtail"]},{"name":"Merienda","category":"Cursivas","tags":["cursivas","merienda"]},{"name":"Alex Brush","category":"Cursivas","tags":["cursivas","alex brush"]},{"name":"Cookie","category":"Cursivas","tags":["cursivas","cookie"]},{"name":"Courgette","category":"Cursivas","tags":["cursivas","courgette"]},{"name":"Damion","category":"Cursivas","tags":["cursivas","damion"]},{"name":"Italianno","category":"Cursivas","tags":["cursivas","italianno"]},{"name":"Marck Script","category":"Cursivas","tags":["cursivas","marck script"]},{"name":"Mrs Saint Delafield","category":"Cursivas","tags":["cursivas","mrs saint delafield"]},{"name":"Petit Formal Script","category":"Cursivas","tags":["cursivas","petit formal script"]},{"name":"Pinyon Script","category":"Cursivas","tags":["cursivas","pinyon script"]},{"name":"Qwigley","category":"Cursivas","tags":["cursivas","qwigley"]},{"name":"Caveat","category":"Manuscritas","tags":["manuscritas","caveat"]},{"name":"Permanent Marker","category":"Manuscritas","tags":["manuscritas","permanent marker"]},{"name":"Patrick Hand","category":"Manuscritas","tags":["manuscritas","patrick hand"]},{"name":"Indie Flower","category":"Manuscritas","tags":["manuscritas","indie flower"]},{"name":"Shadows Into Light","category":"Manuscritas","tags":["manuscritas","shadows into light"]},{"name":"Handlee","category":"Manuscritas","tags":["manuscritas","handlee"]},{"name":"Kalam","category":"Manuscritas","tags":["manuscritas","kalam"]},{"name":"Gloria Hallelujah","category":"Manuscritas","tags":["manuscritas","gloria hallelujah"]},{"name":"Gochi Hand","category":"Manuscritas","tags":["manuscritas","gochi hand"]},{"name":"Coming Soon","category":"Manuscritas","tags":["manuscritas","coming soon"]},{"name":"Architects Daughter","category":"Manuscritas","tags":["manuscritas","architects daughter"]},{"name":"Covered By Your Grace","category":"Manuscritas","tags":["manuscritas","covered by your grace"]},{"name":"Homemade Apple","category":"Manuscritas","tags":["manuscritas","homemade apple"]},{"name":"Just Another Hand","category":"Manuscritas","tags":["manuscritas","just another hand"]},{"name":"La Belle Aurore","category":"Manuscritas","tags":["manuscritas","la belle aurore"]},{"name":"Nothing You Could Do","category":"Manuscritas","tags":["manuscritas","nothing you could do"]},{"name":"Reenie Beanie","category":"Manuscritas","tags":["manuscritas","reenie beanie"]},{"name":"Schoolbell","category":"Manuscritas","tags":["manuscritas","schoolbell"]},{"name":"Sue Ellen Francisco","category":"Manuscritas","tags":["manuscritas","sue ellen francisco"]},{"name":"Zeyada","category":"Manuscritas","tags":["manuscritas","zeyada"]},{"name":"Bungee","category":"Retrô","tags":["retrô","bungee"]},{"name":"Monoton","category":"Retrô","tags":["retrô","monoton"]},{"name":"Righteous","category":"Retrô","tags":["retrô","righteous"]},{"name":"Limelight","category":"Retrô","tags":["retrô","limelight"]},{"name":"Fredericka the Great","category":"Retrô","tags":["retrô","fredericka the great"]},{"name":"Rye","category":"Retrô","tags":["retrô","rye"]},{"name":"Faster One","category":"Retrô","tags":["retrô","faster one"]},{"name":"Boogaloo","category":"Retrô","tags":["retrô","boogaloo"]},{"name":"Alfa Slab One","category":"Retrô","tags":["retrô","alfa slab one"]},{"name":"Press Start 2P","category":"Retrô","tags":["retrô","press start 2p"]},{"name":"Black Ops One","category":"Retrô","tags":["retrô","black ops one"]},{"name":"Audiowide","category":"Retrô","tags":["retrô","audiowide"]},{"name":"Bowlby One SC","category":"Retrô","tags":["retrô","bowlby one sc"]},{"name":"Cherry Cream Soda","category":"Retrô","tags":["retrô","cherry cream soda"]},{"name":"Fascinate","category":"Retrô","tags":["retrô","fascinate"]},{"name":"Fascinate Inline","category":"Retrô","tags":["retrô","fascinate inline"]},{"name":"Fugaz One","category":"Retrô","tags":["retrô","fugaz one"]},{"name":"Galindo","category":"Retrô","tags":["retrô","galindo"]},{"name":"Graduate","category":"Retrô","tags":["retrô","graduate"]},{"name":"Koulen","category":"Retrô","tags":["retrô","koulen"]},{"name":"Special Elite","category":"Vintage","tags":["vintage","special elite"]},{"name":"UnifrakturCook","category":"Vintage","tags":["vintage","unifrakturcook"]},{"name":"UnifrakturMaguntia","category":"Vintage","tags":["vintage","unifrakturmaguntia"]},{"name":"IM Fell English","category":"Vintage","tags":["vintage","im fell english"]},{"name":"IM Fell DW Pica","category":"Vintage","tags":["vintage","im fell dw pica"]},{"name":"IM Fell Double Pica","category":"Vintage","tags":["vintage","im fell double pica"]},{"name":"IM Fell French Canon","category":"Vintage","tags":["vintage","im fell french canon"]},{"name":"Grenze Gotisch","category":"Vintage","tags":["vintage","grenze gotisch"]},{"name":"Pirata One","category":"Vintage","tags":["vintage","pirata one"]},{"name":"Sancreek","category":"Vintage","tags":["vintage","sancreek"]},{"name":"Ewert","category":"Vintage","tags":["vintage","ewert"]},{"name":"Smokum","category":"Vintage","tags":["vintage","smokum"]},{"name":"Diplomata","category":"Vintage","tags":["vintage","diplomata"]},{"name":"Diplomata SC","category":"Vintage","tags":["vintage","diplomata sc"]},{"name":"MedievalSharp","category":"Vintage","tags":["vintage","medievalsharp"]},{"name":"Metamorphous","category":"Vintage","tags":["vintage","metamorphous"]},{"name":"New Rocker","category":"Vintage","tags":["vintage","new rocker"]},{"name":"Uncial Antiqua","category":"Vintage","tags":["vintage","uncial antiqua"]},{"name":"Germania One","category":"Vintage","tags":["vintage","germania one"]},{"name":"Almendra","category":"Vintage","tags":["vintage","almendra"]},{"name":"Bebas Neue","category":"Anúncios","tags":["anúncios","bebas neue"]},{"name":"Anton","category":"Anúncios","tags":["anúncios","anton"]},{"name":"Oswald","category":"Anúncios","tags":["anúncios","oswald"]},{"name":"League Spartan","category":"Anúncios","tags":["anúncios","league spartan"]},{"name":"Archivo Black","category":"Anúncios","tags":["anúncios","archivo black"]},{"name":"Teko","category":"Anúncios","tags":["anúncios","teko"]},{"name":"Staatliches","category":"Anúncios","tags":["anúncios","staatliches"]},{"name":"Barlow Condensed","category":"Anúncios","tags":["anúncios","barlow condensed"]},{"name":"Russo One","category":"Anúncios","tags":["anúncios","russo one"]},{"name":"Fjalla One","category":"Anúncios","tags":["anúncios","fjalla one"]},{"name":"Big Shoulders Display","category":"Anúncios","tags":["anúncios","big shoulders display"]},{"name":"Big Shoulders Text","category":"Anúncios","tags":["anúncios","big shoulders text"]},{"name":"Changa One","category":"Anúncios","tags":["anúncios","changa one"]},{"name":"Passion One","category":"Anúncios","tags":["anúncios","passion one"]},{"name":"Paytone One","category":"Anúncios","tags":["anúncios","paytone one"]},{"name":"Ultra","category":"Anúncios","tags":["anúncios","ultra"]},{"name":"Saira Condensed","category":"Anúncios","tags":["anúncios","saira condensed"]},{"name":"Saira Extra Condensed","category":"Anúncios","tags":["anúncios","saira extra condensed"]},{"name":"Squada One","category":"Anúncios","tags":["anúncios","squada one"]},{"name":"Yanone Kaffeesatz","category":"Anúncios","tags":["anúncios","yanone kaffeesatz"]},{"name":"Bangers","category":"Grafite / Street","tags":["grafite / street","bangers"]},{"name":"Rock Salt","category":"Grafite / Street","tags":["grafite / street","rock salt"]},{"name":"Sedgwick Ave","category":"Grafite / Street","tags":["grafite / street","sedgwick ave"]},{"name":"Sedgwick Ave Display","category":"Grafite / Street","tags":["grafite / street","sedgwick ave display"]},{"name":"Luckiest Guy","category":"Grafite / Street","tags":["grafite / street","luckiest guy"]},{"name":"Knewave","category":"Grafite / Street","tags":["grafite / street","knewave"]},{"name":"Londrina Sketch","category":"Grafite / Street","tags":["grafite / street","londrina sketch"]},{"name":"Frijole","category":"Grafite / Street","tags":["grafite / street","frijole"]},{"name":"Rubik Spray Paint","category":"Grafite / Street","tags":["grafite / street","rubik spray paint"]},{"name":"Rubik Dirt","category":"Grafite / Street","tags":["grafite / street","rubik dirt"]},{"name":"Rubik Glitch","category":"Grafite / Street","tags":["grafite / street","rubik glitch"]},{"name":"Rubik Marker Hatch","category":"Grafite / Street","tags":["grafite / street","rubik marker hatch"]},{"name":"Rubik Puddles","category":"Grafite / Street","tags":["grafite / street","rubik puddles"]},{"name":"Rubik Wet Paint","category":"Grafite / Street","tags":["grafite / street","rubik wet paint"]},{"name":"Lacquer","category":"Grafite / Street","tags":["grafite / street","lacquer"]},{"name":"Nosifer","category":"Grafite / Street","tags":["grafite / street","nosifer"]},{"name":"Butcherman","category":"Grafite / Street","tags":["grafite / street","butcherman"]},{"name":"Creepster","category":"Grafite / Street","tags":["grafite / street","creepster"]},{"name":"Metal Mania","category":"Grafite / Street","tags":["grafite / street","metal mania"]},{"name":"Trade Winds","category":"Grafite / Street","tags":["grafite / street","trade winds"]},{"name":"Cinzel Decorative","category":"Luxo","tags":["luxo","cinzel decorative"]},{"name":"Cormorant Upright","category":"Luxo","tags":["luxo","cormorant upright"]},{"name":"Julius Sans One","category":"Luxo","tags":["luxo","julius sans one"]},{"name":"Poiret One","category":"Luxo","tags":["luxo","poiret one"]},{"name":"Megrim","category":"Luxo","tags":["luxo","megrim"]},{"name":"MonteCarlo","category":"Luxo","tags":["luxo","montecarlo"]},{"name":"Tangerine","category":"Luxo","tags":["luxo","tangerine"]},{"name":"Niconne","category":"Luxo","tags":["luxo","niconne"]},{"name":"Ballet","category":"Luxo","tags":["luxo","ballet"]},{"name":"Carattere","category":"Luxo","tags":["luxo","carattere"]},{"name":"Luxurious Script","category":"Luxo","tags":["luxo","luxurious script"]},{"name":"Ms Madi","category":"Luxo","tags":["luxo","ms madi"]},{"name":"WindSong","category":"Luxo","tags":["luxo","windsong"]},{"name":"Waterfall","category":"Luxo","tags":["luxo","waterfall"]},{"name":"Birthstone","category":"Luxo","tags":["luxo","birthstone"]},{"name":"Bonheur Royale","category":"Luxo","tags":["luxo","bonheur royale"]},{"name":"Whisper","category":"Luxo","tags":["luxo","whisper"]},{"name":"Explora","category":"Luxo","tags":["luxo","explora"]},{"name":"Orbitron","category":"Tecnológicas","tags":["tecnológicas","orbitron"]},{"name":"Rajdhani","category":"Tecnológicas","tags":["tecnológicas","rajdhani"]},{"name":"Share Tech Mono","category":"Tecnológicas","tags":["tecnológicas","share tech mono"]},{"name":"Aldrich","category":"Tecnológicas","tags":["tecnológicas","aldrich"]},{"name":"Michroma","category":"Tecnológicas","tags":["tecnológicas","michroma"]},{"name":"Quantico","category":"Tecnológicas","tags":["tecnológicas","quantico"]},{"name":"Electrolize","category":"Tecnológicas","tags":["tecnológicas","electrolize"]},{"name":"Oxanium","category":"Tecnológicas","tags":["tecnológicas","oxanium"]},{"name":"Tomorrow","category":"Tecnológicas","tags":["tecnológicas","tomorrow"]},{"name":"Syncopate","category":"Tecnológicas","tags":["tecnológicas","syncopate"]},{"name":"Chakra Petch","category":"Tecnológicas","tags":["tecnológicas","chakra petch"]},{"name":"Iceland","category":"Tecnológicas","tags":["tecnológicas","iceland"]},{"name":"Nova Square","category":"Tecnológicas","tags":["tecnológicas","nova square"]},{"name":"Geo","category":"Tecnológicas","tags":["tecnológicas","geo"]},{"name":"Major Mono Display","category":"Tecnológicas","tags":["tecnológicas","major mono display"]},{"name":"Space Mono","category":"Tecnológicas","tags":["tecnológicas","space mono"]},{"name":"JetBrains Mono","category":"Tecnológicas","tags":["tecnológicas","jetbrains mono"]},{"name":"IBM Plex Mono","category":"Tecnológicas","tags":["tecnológicas","ibm plex mono"]},{"name":"Roboto Mono","category":"Tecnológicas","tags":["tecnológicas","roboto mono"]},{"name":"Source Code Pro","category":"Tecnológicas","tags":["tecnológicas","source code pro"]},{"name":"Bruno Ace","category":"Futuristas","tags":["futuristas","bruno ace"]},{"name":"Bruno Ace SC","category":"Futuristas","tags":["futuristas","bruno ace sc"]},{"name":"Zen Dots","category":"Futuristas","tags":["futuristas","zen dots"]},{"name":"Turret Road","category":"Futuristas","tags":["futuristas","turret road"]},{"name":"Wallpoet","category":"Futuristas","tags":["futuristas","wallpoet"]},{"name":"Revalia","category":"Futuristas","tags":["futuristas","revalia"]},{"name":"Goldman","category":"Futuristas","tags":["futuristas","goldman"]},{"name":"Saira Stencil One","category":"Futuristas","tags":["futuristas","saira stencil one"]},{"name":"Exo","category":"Futuristas","tags":["futuristas","exo"]},{"name":"Kode Mono","category":"Futuristas","tags":["futuristas","kode mono"]},{"name":"Micro 5","category":"Futuristas","tags":["futuristas","micro 5"]},{"name":"Sixtyfour","category":"Futuristas","tags":["futuristas","sixtyfour"]},{"name":"Fredoka","category":"Infantis","tags":["infantis","fredoka"]},{"name":"Baloo 2","category":"Infantis","tags":["infantis","baloo 2"]},{"name":"Bubblegum Sans","category":"Infantis","tags":["infantis","bubblegum sans"]},{"name":"Chewy","category":"Infantis","tags":["infantis","chewy"]},{"name":"Coiny","category":"Infantis","tags":["infantis","coiny"]},{"name":"DynaPuff","category":"Infantis","tags":["infantis","dynapuff"]},{"name":"Gorditas","category":"Infantis","tags":["infantis","gorditas"]},{"name":"Grandstander","category":"Infantis","tags":["infantis","grandstander"]},{"name":"Jolly Lodger","category":"Infantis","tags":["infantis","jolly lodger"]},{"name":"Lilita One","category":"Infantis","tags":["infantis","lilita one"]},{"name":"Mochiy Pop One","category":"Infantis","tags":["infantis","mochiy pop one"]},{"name":"Modak","category":"Infantis","tags":["infantis","modak"]},{"name":"Mouse Memoirs","category":"Infantis","tags":["infantis","mouse memoirs"]},{"name":"Pangolin","category":"Infantis","tags":["infantis","pangolin"]},{"name":"Rammetto One","category":"Infantis","tags":["infantis","rammetto one"]},{"name":"Ribeye","category":"Infantis","tags":["infantis","ribeye"]},{"name":"Ribeye Marrow","category":"Infantis","tags":["infantis","ribeye marrow"]},{"name":"Sniglet","category":"Infantis","tags":["infantis","sniglet"]},{"name":"Titan One","category":"Infantis","tags":["infantis","titan one"]},{"name":"Wendy One","category":"Infantis","tags":["infantis","wendy one"]},{"name":"Amatic SC","category":"Decorativas","tags":["decorativas","amatic sc"]},{"name":"Barriecito","category":"Decorativas","tags":["decorativas","barriecito"]},{"name":"Barrio","category":"Decorativas","tags":["decorativas","barrio"]},{"name":"Cabin Sketch","category":"Decorativas","tags":["decorativas","cabin sketch"]},{"name":"Caesar Dressing","category":"Decorativas","tags":["decorativas","caesar dressing"]},{"name":"Chelsea Market","category":"Decorativas","tags":["decorativas","chelsea market"]},{"name":"Chicle","category":"Decorativas","tags":["decorativas","chicle"]},{"name":"Codystar","category":"Decorativas","tags":["decorativas","codystar"]},{"name":"Emilys Candy","category":"Decorativas","tags":["decorativas","emilys candy"]},{"name":"Flavors","category":"Decorativas","tags":["decorativas","flavors"]},{"name":"Fontdiner Swanky","category":"Decorativas","tags":["decorativas","fontdiner swanky"]},{"name":"Geostar","category":"Decorativas","tags":["decorativas","geostar"]},{"name":"Geostar Fill","category":"Decorativas","tags":["decorativas","geostar fill"]},{"name":"Griffy","category":"Decorativas","tags":["decorativas","griffy"]},{"name":"Hanalei","category":"Decorativas","tags":["decorativas","hanalei"]},{"name":"Henny Penny","category":"Decorativas","tags":["decorativas","henny penny"]},{"name":"Jacques Francois Shadow","category":"Decorativas","tags":["decorativas","jacques francois shadow"]},{"name":"Londrina Outline","category":"Decorativas","tags":["decorativas","londrina outline"]},{"name":"Monofett","category":"Decorativas","tags":["decorativas","monofett"]},{"name":"Mystery Quest","category":"Decorativas","tags":["decorativas","mystery quest"]},{"name":"Abril Fatface","category":"Display","tags":["display","abril fatface"]},{"name":"Acme","category":"Display","tags":["display","acme"]},{"name":"Alegreya Sans SC","category":"Display","tags":["display","alegreya sans sc"]},{"name":"Bowlby One","category":"Display","tags":["display","bowlby one"]},{"name":"Bungee Shade","category":"Display","tags":["display","bungee shade"]},{"name":"Chonburi","category":"Display","tags":["display","chonburi"]},{"name":"Contrail One","category":"Display","tags":["display","contrail one"]},{"name":"Days One","category":"Display","tags":["display","days one"]},{"name":"Francois One","category":"Display","tags":["display","francois one"]},{"name":"Goblin One","category":"Display","tags":["display","goblin one"]},{"name":"Holtwood One SC","category":"Display","tags":["display","holtwood one sc"]},{"name":"Krona One","category":"Display","tags":["display","krona one"]},{"name":"Lalezar","category":"Display","tags":["display","lalezar"]},{"name":"Mitr","category":"Display","tags":["display","mitr"]},{"name":"Notable","category":"Display","tags":["display","notable"]},{"name":"Patua One","category":"Display","tags":["display","patua one"]},{"name":"Ramabhadra","category":"Display","tags":["display","ramabhadra"]},{"name":"Rowdies","category":"Display","tags":["display","rowdies"]},{"name":"Secular One","category":"Display","tags":["display","secular one"]},{"name":"Shrikhand","category":"Display","tags":["display","shrikhand"]}];
  const FONT_CATEGORIES = ["Favoritas","Mais utilizadas","Todas","Modernas","Elegantes","Minimalistas","Clássicas","Sans Serif","Serif","Cursivas","Manuscritas","Retrô","Vintage","Anúncios","Grafite / Street","Luxo","Tecnológicas","Futuristas","Infantis","Decorativas","Display"];
  const PALETTES = [
    {name:"Minimalista",colors:["#111827","#E5E7EB","#111827","#111827","#6B7280","#F9FAFB"]},
    {name:"Elegante",colors:["#6B2333","#D8C3A5","#201A1B","#6B2333","#B08D57","#F7F2EA"]},
    {name:"Moderna",colors:["#2563EB","#DBEAFE","#172033","#2563EB","#7C3AED","#F8FAFC"]},
    {name:"Corporativa",colors:["#123A5A","#D9E7F1","#10212E","#123A5A","#2F6B8A","#F4F8FB"]},
    {name:"Escura",colors:["#B8DBC3","#173C2C","#F5F4ED","#B8DBC3","#D6A85F","#07140F"]},
    {name:"Clara",colors:["#315C46","#DDEBE3","#18221D","#315C46","#B7791F","#F7F7F3"]},
    {name:"Natureza",colors:["#3D6B4F","#BFD8C2","#1F2E24","#3D6B4F","#8A9A5B","#F1F5EE"]},
    {name:"Terra",colors:["#8B4A2F","#D9B99B","#33241E","#8B4A2F","#C58B57","#F5ECE4"]},
    {name:"Premium",colors:["#191919","#D8C19F","#F6F0E8","#D8C19F","#A67C3D","#0D0D0D"]},
    {name:"Vibrante",colors:["#E63946","#FFD166","#172033","#E63946","#7B2CBF","#FFF8E7"]}
  ];
  let activeFontCategory = "Todas";
  let favoriteFonts = new Set();
  let fontUsage = {};
  let fontView = localStorage.getItem("misarte-font-view") || "grid";
  const loadedFonts = new Set();

  function fontCssUrl(names){
    const families=names.map(name=>`family=${encodeURIComponent(name).replace(/%20/g,"+")}`).join("&");
    return `https://fonts.googleapis.com/css2?${families}&display=swap`;
  }
  function loadFonts(names){
    const pending=[...new Set(names)].filter(name=>!loadedFonts.has(name));
    if(!pending.length) return;
    pending.forEach(name=>loadedFonts.add(name));
    for(let i=0;i<pending.length;i+=12){
      const link=document.createElement("link");
      link.rel="stylesheet";
      link.href=fontCssUrl(pending.slice(i,i+12));
      document.head.append(link);
    }
  }
  function updateFontSample(){
    const name=el.fonte.value||"DM Sans";
    const text=(el.fontPreviewText.value||"Cervejaria Inconfidentes").trim()||"Cervejaria Inconfidentes";
    loadFonts([name]);
    if(el.fontLivePreviewName) el.fontLivePreviewName.textContent=name;
    if(el.fontLivePreviewSample){
      el.fontLivePreviewSample.textContent=text;
      el.fontLivePreviewSample.style.fontFamily=`"${name}", sans-serif`;
    }
  }

  function setSelectedFont(name){
    const font=FONT_LIBRARY.find(item=>item.name===name)||FONT_LIBRARY[0];
    el.fonte.value=font.name;
    el.selectedFontName.textContent=font.name;
    el.selectedFontName.style.fontFamily=`"${font.name}", sans-serif`;
    loadFonts([font.name]);
    updateFontSample();
    fontUsage[font.name]=(fontUsage[font.name]||0)+1;
    localStorage.setItem(`misarte-font-usage-${clientId}`,JSON.stringify(fontUsage));
    updateLivePreview();
    el.fontGrid.querySelectorAll(".font-option").forEach(button=>{
      const selected=button.dataset.font===font.name;
      button.classList.toggle("is-selected",selected);
      button.setAttribute("aria-selected",String(selected));
    });
  }
  function renderFontCategories(){
    el.fontCategories.innerHTML="";
    FONT_CATEGORIES.forEach(category=>{
      const button=document.createElement("button");
      button.type="button";
      button.className=`font-category${category===activeFontCategory?" is-active":""}`;
      button.textContent=category;
      button.setAttribute("role","tab");
      button.setAttribute("aria-selected",String(category===activeFontCategory));
      button.addEventListener("click",(event)=>{
        // Evita que o clique chegue ao listener global e feche a biblioteca
        // depois que os botões de categoria forem renderizados novamente.
        event.stopPropagation();
        activeFontCategory=category;
        renderFontCategories();
        renderFonts();
      });
      el.fontCategories.append(button);
    });
  }
  function renderFonts(){
    const query=el.fontSearch.value.trim().toLocaleLowerCase("pt-BR");
    let fonts=FONT_LIBRARY.filter(font=>{
      const searchable=`${font.name} ${font.category} ${(font.tags||[]).join(" ")}`.toLocaleLowerCase("pt-BR");
      const categoryMatches=activeFontCategory==="Todas"
        ||(activeFontCategory==="Favoritas"&&favoriteFonts.has(font.name))
        ||(activeFontCategory==="Mais utilizadas"&&(fontUsage[font.name]||0)>0)
        ||font.category===activeFontCategory;
      return categoryMatches&&(!query||searchable.includes(query));
    });
    if(activeFontCategory==="Mais utilizadas"){
      fonts.sort((a,b)=>(fontUsage[b.name]||0)-(fontUsage[a.name]||0));
    }
    el.fontGrid.innerHTML="";
    el.fontGrid.classList.toggle("is-list",fontView==="list");
    el.fontEmpty.hidden=fonts.length!==0;
    el.fontResultCount.textContent=`${fonts.length} ${fonts.length===1?"fonte encontrada":"fontes encontradas"}`;
    loadFonts(fonts.slice(0,72).map(font=>font.name));
    fonts.forEach(font=>{
      const button=document.createElement("button");
      button.type="button";
      button.className=`font-option${el.fonte.value===font.name?" is-selected":""}`;
      button.dataset.font=font.name;
      button.setAttribute("role","option");
      button.setAttribute("aria-selected",String(el.fonte.value===font.name));
      const uses=fontUsage[font.name]||0;
      button.innerHTML=`<span class="font-option-preview" style="font-family:'${font.name}',sans-serif">Aa</span><span class="font-option-meta"><strong style="font-family:'${font.name}',sans-serif">${font.name}</strong><small>${font.category}${uses?` • usada ${uses}x`:""}</small></span><span class="font-option-check" aria-hidden="true">✓</span><span class="font-favorite${favoriteFonts.has(font.name)?" is-favorite":""}" role="button" tabindex="0" aria-label="${favoriteFonts.has(font.name)?"Remover dos favoritos":"Adicionar aos favoritos"}" title="Favoritar">★</span>`;
      const favoriteButton=button.querySelector(".font-favorite");
      const toggleFavorite=(event)=>{
        event.stopPropagation();
        favoriteFonts.has(font.name)?favoriteFonts.delete(font.name):favoriteFonts.add(font.name);
        localStorage.setItem(`misarte-favorite-fonts-${clientId}`,JSON.stringify([...favoriteFonts]));
        renderFontCategories(); renderFonts();
      };
      favoriteButton.addEventListener("click",toggleFavorite);
      favoriteButton.addEventListener("keydown",event=>{ if(event.key==="Enter"||event.key===" "){ event.preventDefault(); toggleFavorite(event); } });
      button.addEventListener("mouseenter",()=>loadFonts([font.name]),{once:true});
      button.addEventListener("click",()=>setSelectedFont(font.name));
      el.fontGrid.append(button);
    });
  }
  function openFontLibrary(){
    el.fontLibrary.hidden=false;
    el.fontPickerButton.setAttribute("aria-expanded","true");
    renderFonts();
    setTimeout(()=>el.fontSearch.focus(),0);
  }
  function closeFontLibrary(){
    el.fontLibrary.hidden=true;
    el.fontPickerButton.setAttribute("aria-expanded","false");
  }
  function initFontLibrary(){
    try{
      favoriteFonts=new Set(JSON.parse(localStorage.getItem(`misarte-favorite-fonts-${clientId}`)||"[]"));
      fontUsage=JSON.parse(localStorage.getItem(`misarte-font-usage-${clientId}`)||"{}");
    }catch(_){ favoriteFonts=new Set(); fontUsage={}; }
    const syncViewButtons=()=>{
      el.fontViewGrid?.classList.toggle("is-active",fontView==="grid");
      el.fontViewList?.classList.toggle("is-active",fontView==="list");
    };
    syncViewButtons();
    el.fontViewGrid?.addEventListener("click",event=>{event.stopPropagation();fontView="grid";localStorage.setItem("misarte-font-view",fontView);syncViewButtons();renderFonts();});
    el.fontViewList?.addEventListener("click",event=>{event.stopPropagation();fontView="list";localStorage.setItem("misarte-font-view",fontView);syncViewButtons();renderFonts();});
    renderFontCategories();
    renderFonts();
    el.fontPickerButton.addEventListener("click",()=>el.fontLibrary.hidden?openFontLibrary():closeFontLibrary());
    el.closeFontLibrary.addEventListener("click",closeFontLibrary);
    el.fontSearch.addEventListener("input",renderFonts);
    el.fontPreviewText.addEventListener("input",updateFontSample);
    updateFontSample();
    document.addEventListener("keydown",event=>{ if(event.key==="Escape"&&!el.fontLibrary.hidden) closeFontLibrary(); });
    document.addEventListener("click",event=>{
      if(!el.fontLibrary.hidden&&!el.fontLibrary.contains(event.target)&&!el.fontPickerButton.contains(event.target)) closeFontLibrary();
    });
  }

  function toast(message,type="success"){
    el.toast.textContent=message; el.toast.className=`toast ${type}`; el.toast.hidden=false;
    clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.toast.hidden=true,3000);
  }
  function isHex(v){ return /^#[0-9a-f]{6}$/i.test(v); }
  function getColorValues(){
    const result={};
    colors.forEach(([,text,field])=>result[field]=$("#"+text).value.trim());
    return result;
  }
  function updateLivePreview(){
    const frame=el.preview;
    try{
      const doc=frame.contentDocument;
      if(!doc) return;
      const root=doc.documentElement;
      const c=getColorValues();
      root.style.setProperty("--brand-primary",c.cor_primaria||"#B8DBC3");
      root.style.setProperty("--brand-secondary",c.cor_secundaria||"#173C2C");
      root.style.setProperty("--brand-text",c.cor_texto||"#F5F4ED");
      root.style.setProperty("--brand-button",c.cor_botao||"#B8DBC3");
      root.style.setProperty("--brand-accent",c.cor_destaque||"#D6A85F");
      root.style.setProperty("--bg",c.cor_fundo||"#07140F");
      root.style.setProperty("--brand-font",`"${el.fonte.value||"DM Sans"}",sans-serif`);
      doc.body.style.backgroundColor=c.cor_fundo||"#07140F";
    }catch(_){}
  }
  function syncColors(){
    colors.forEach(([picker,text])=>{
      const p=$("#"+picker), t=$("#"+text);
      p.addEventListener("input",()=>{t.value=p.value.toUpperCase();el.selectedPaletteName.textContent="Personalizada";updateLivePreview();});
      t.addEventListener("input",()=>{ if(isHex(t.value)){p.value=t.value;el.selectedPaletteName.textContent="Personalizada";updateLivePreview();} });
    });
    el.tema.addEventListener("change",updateLivePreview);
    el.preview.addEventListener("load",()=>setTimeout(updateLivePreview,80));
  }
  function applyPalette(palette){
    palette.colors.forEach((value,index)=>{
      const [picker,text]=colors[index];
      $("#"+picker).value=value; $("#"+text).value=value.toUpperCase();
    });
    el.selectedPaletteName.textContent=palette.name;
    el.tema.value=["Escura","Premium"].includes(palette.name)?"escuro":"claro";
    renderPalettes(); updateLivePreview();
  }
  function renderPalettes(){
    el.paletteGrid.innerHTML="";
    PALETTES.forEach(palette=>{
      const button=document.createElement("button");
      button.type="button"; button.className="palette-card";
      button.innerHTML=`<span class="palette-swatches">${palette.colors.slice(0,5).map(c=>`<i style="background:${c}"></i>`).join("")}</span><strong>${palette.name}</strong>`;
      button.addEventListener("click",()=>applyPalette(palette));
      el.paletteGrid.append(button);
    });
  }
  function renderImage(node,url,label){
    node.innerHTML=url?`<img src="${url}" alt="${label}">`:`<span>Sem ${label}</span>`;
  }
  function extension(file){ return {"image/png":"png","image/jpeg":"jpg","image/webp":"webp"}[file.type]; }
  function validate(file){
    if(!allowed.includes(file.type)) throw new Error("Use PNG, JPG ou WEBP.");
    if(file.size>MAX_SIZE) throw new Error("A imagem deve ter no máximo 5 MB.");
  }
  async function upload(kind,file){
    validate(file);
    const path=`${clientId}/${kind}.${extension(file)}`;
    const {error}=await db.storage.from(BUCKET).upload(path,file,{upsert:true,contentType:file.type,cacheControl:"3600"});
    if(error) throw error;
    const {data}=db.storage.from(BUCKET).getPublicUrl(path);
    const url=`${data.publicUrl}?v=${Date.now()}`;
    const field=kind==="banner"?"banner_url":"favicon_url";
    const {error:updateError}=await db.from("clientes").update({[field]:url}).eq("id",clientId);
    if(updateError) throw updateError;
    current[field]=url;
    renderImage(kind==="banner"?el.bannerPreview:el.faviconPreview,url,kind);
    (kind==="banner"?el.removeBanner:el.removeFavicon).hidden=false;
    refreshPreview();
    toast(`${kind==="banner"?"Banner":"Favicon"} atualizado.`);
  }
  async function remove(kind){
    const field=kind==="banner"?"banner_url":"favicon_url";
    const url=current[field];
    if(url){
      const marker=`/storage/v1/object/public/${BUCKET}/`;
      const relative=url.split("?")[0].split(marker)[1];
      if(relative) await db.storage.from(BUCKET).remove([decodeURIComponent(relative)]);
    }
    const {error}=await db.from("clientes").update({[field]:null}).eq("id",clientId);
    if(error) throw error;
    current[field]=null;
    renderImage(kind==="banner"?el.bannerPreview:el.faviconPreview,null,kind);
    (kind==="banner"?el.removeBanner:el.removeFavicon).hidden=true;
    refreshPreview();
    toast("Imagem removida.");
  }
  function refreshPreview(){
    el.preview.src=`../publico.html?cliente=${encodeURIComponent(clientId)}&preview=${Date.now()}`;
  }
  async function load(){
    if(!clientId){ location.replace("./clientes.html"); return; }
    const {data:sessionData}=await db.auth.getSession();
    if(!sessionData.session){ location.replace("./login.html"); return; }
    el.email.textContent=sessionData.session.user.email||"Usuária autenticada";
    const {data,error}=await db.from("clientes")
      .select("id,nome,empresa,cor_primaria,cor_secundaria,cor_texto,cor_botao,cor_destaque,cor_fundo,tema,fonte,fontes_favoritas,banner_url,favicon_url,catalogo_destaque")
      .eq("id",clientId).single();
    if(error){
      el.warning.hidden=false; el.loader.hidden=true; el.app.hidden=false;
      throw error;
    }
    current=data;
    const storedFavorites=JSON.parse(localStorage.getItem(`misarte-favorite-fonts-${clientId}`)||"[]");
    favoriteFonts=new Set((data.fontes_favoritas&&data.fontes_favoritas.length?data.fontes_favoritas:storedFavorites)||[]);
    renderFontCategories(); renderFonts();
    el.name.textContent=data.nome||data.empresa||"Cliente";
    el.tema.value=data.tema||"escuro"; setSelectedFont(data.fonte||"DM Sans");
    colors.forEach(([picker,text,field])=>{
      const value=data[field]||({cor_primaria:"#B8DBC3",cor_secundaria:"#173C2C",cor_texto:"#F5F4ED",cor_botao:"#B8DBC3",cor_destaque:"#D6A85F",cor_fundo:"#07140F"}[field]);
      $("#"+picker).value=value; $("#"+text).value=value.toUpperCase();
    });
    const {data:catalogs}=await db.from("catalogos").select("id,nome,status").eq("cliente_id",clientId).order("ordem");
    (catalogs||[]).filter(c=>c.status==="publicado").forEach(c=>{
      const o=document.createElement("option"); o.value=c.id; o.textContent=c.nome; el.destaque.append(o);
    });
    el.destaque.value=data.catalogo_destaque||"";
    renderImage(el.bannerPreview,data.banner_url,"banner");
    renderImage(el.faviconPreview,data.favicon_url,"favicon");
    el.removeBanner.hidden=!data.banner_url; el.removeFavicon.hidden=!data.favicon_url;
    const publicUrl=`../publico.html?cliente=${encodeURIComponent(clientId)}`;
    el.previewTop.href=publicUrl; el.identity.href=`./cliente.html?id=${encodeURIComponent(clientId)}`;
    el.catalogs.href=`./catalogos.html?id=${encodeURIComponent(clientId)}`;
    el.back.href=`./cliente.html?id=${encodeURIComponent(clientId)}`;
    refreshPreview();
    el.loader.hidden=true; el.app.hidden=false;
  }
  el.form.addEventListener("submit",async e=>{
    e.preventDefault();
    try{
      const payload={tema:el.tema.value,fonte:el.fonte.value,fontes_favoritas:[...favoriteFonts],catalogo_destaque:el.destaque.value||null};
      colors.forEach(([,text,field])=>{ const v=$("#"+text).value.trim(); if(!isHex(v)) throw new Error("Use cores no formato #RRGGBB."); payload[field]=v.toUpperCase(); });
      el.save.disabled=true; el.save.textContent="Salvando...";
      const {error}=await db.from("clientes").update(payload).eq("id",clientId);
      if(error) throw error;
      Object.assign(current,payload); refreshPreview(); toast("Aparência salva com sucesso.");
    }catch(error){ console.error(error); el.warning.hidden=/column|schema/i.test(error.message||""); toast(error.message||"Não foi possível salvar.","error"); }
    finally{ el.save.disabled=false; el.save.textContent="Salvar aparência"; }
  });
  el.bannerInput.addEventListener("change",async()=>{ const f=el.bannerInput.files[0]; if(f) try{await upload("banner",f)}catch(e){toast(e.message,"error")} el.bannerInput.value=""; });
  el.faviconInput.addEventListener("change",async()=>{ const f=el.faviconInput.files[0]; if(f) try{await upload("favicon",f)}catch(e){toast(e.message,"error")} el.faviconInput.value=""; });
  el.removeBanner.addEventListener("click",()=>remove("banner").catch(e=>toast(e.message,"error")));
  el.removeFavicon.addEventListener("click",()=>remove("favicon").catch(e=>toast(e.message,"error")));
  $("#refreshPreview").addEventListener("click",refreshPreview);
  el.menu.addEventListener("click",()=>el.sidebar.classList.toggle("is-open"));
  el.logout.addEventListener("click",async()=>{await db.auth.signOut();location.replace("./login.html")});
  syncColors();
  initFontLibrary();
  renderPalettes();
  load().catch(e=>{console.error(e);toast(e.message||"Erro ao carregar.","error")});
})();
