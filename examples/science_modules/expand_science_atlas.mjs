import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));

function parseCSV(text) { const rows=[]; let row=[],cell="",quoted=false; for(let i=0;i<text.length;i++){const ch=text[i]; if(quoted){if(ch==='"'&&text[i+1]==='"'){cell+='"';i++;}else if(ch==='"')quoted=false;else cell+=ch;}else if(ch==='"')quoted=true;else if(ch===','){row.push(cell);cell="";}else if(ch==='\n'){row.push(cell.replace(/\r$/,"") );rows.push(row);row=[];cell="";}else cell+=ch;} if(cell||row.length){row.push(cell);rows.push(row);} const headers=rows.shift(); return rows.filter(r=>r.some(Boolean)).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]??""]))); }
function csv(rows, headers){const q=v=>{const s=String(v??"");return /[",\n\r]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;};return [headers.join(","),...rows.map(r=>headers.map(h=>q(r[h])).join(","))].join("\n")+"\n";}
function slug(value){return String(value).normalize("NFKD").replace(/[^\w\s-]/g,"").trim().toLowerCase().replace(/[\s_-]+/g,"_").slice(0,90);}
const F=(name,topics)=>[name,topics.split("|")];

const catalog=[
  ["mathematical_sciences","Mathematical Sciences",[
    F("Foundations and logic","proof theory|model theory|axiomatic set theory|type theory|computability and undecidability"),F("Algebra","group representations|commutative rings|homological algebra|Galois theory|Lie groups and Lie algebras"),F("Analysis","measure and integration|operator theory|harmonic analysis|partial differential equations|calculus of variations"),F("Geometry and topology","algebraic topology|differential topology|Riemannian geometry|symplectic geometry|geometric measure theory"),F("Discrete and applied mathematics","combinatorics|graph algorithms|optimization theory|numerical mathematics|mathematical control")]],
  ["probability_statistics","Probability Statistics and Data Science",[
    F("Probability","measure-theoretic probability|stochastic processes|martingales|random matrices|stochastic differential equations"),F("Mathematical statistics","estimation theory|hypothesis testing|asymptotic statistics|nonparametric statistics|high-dimensional statistics"),F("Bayesian science","Bayesian computation|hierarchical models|Bayesian nonparametrics|probabilistic programming|decision theory"),F("Causal and experimental science","causal graphs|potential outcomes|randomized experiments|quasi-experimental design|mediation analysis"),F("Data science","data visualization|dimensionality reduction|anomaly detection|data integration|reproducible analytics")]],
  ["fundamental_physics","Fundamental Physics",[
    F("Classical and continuum physics","analytical mechanics|continuum mechanics|fluid mechanics|classical field theory|nonlinear waves"),F("Quantum physics","quantum foundations|quantum measurement|open quantum systems|many-body quantum theory|quantum information"),F("Relativity and gravitation","special relativity|general relativity|black-hole physics|gravitational radiation|relativistic astrophysics"),F("Particle and nuclear physics","gauge theories|standard-model phenomenology|neutrino physics|nuclear structure|heavy-ion collisions"),F("Statistical and nonlinear physics","equilibrium ensembles|nonequilibrium thermodynamics|phase transitions|critical phenomena|chaos and turbulence")]],
  ["astronomy_cosmology","Astronomy Cosmology and Space Science",[
    F("Observational astronomy","optical astronomy|radio astronomy|infrared astronomy|high-energy astronomy|time-domain astronomy"),F("Stellar and galactic astrophysics","stellar structure|stellar nucleosynthesis|galaxy formation|galactic dynamics|interstellar medium"),F("Cosmology","early-universe physics|cosmic microwave background|large-scale structure|dark matter|dark energy"),F("Planetary science","planet formation|planetary atmospheres|exoplanets|small Solar-System bodies|planetary geophysics"),F("Space and astrobiology","space weather|heliophysics|astrochemistry|habitability|biosignatures")]],
  ["chemical_sciences","Chemical Sciences",[
    F("Physical chemistry","chemical thermodynamics|reaction kinetics|spectroscopy|surface chemistry|electrochemistry"),F("Organic chemistry","reaction mechanisms|stereochemistry|organic synthesis|organometallic chemistry|natural products"),F("Inorganic chemistry","coordination chemistry|main-group chemistry|solid-state chemistry|bioinorganic chemistry|catalysis"),F("Analytical chemistry","mass spectrometry|chromatography|electroanalysis|chemical sensors|trace analysis"),F("Theoretical chemistry","quantum chemistry|electronic structure|molecular simulation|statistical thermodynamics|chemical informatics")]],
  ["materials_science","Materials Science and Nanotechnology",[
    F("Electronic materials","semiconductors|superconductors|topological materials|dielectrics|spintronics"),F("Structural materials","metals and alloys|ceramics|polymers|composites|fracture and fatigue"),F("Nanoscience","nanoparticles|two-dimensional materials|quantum dots|nanofabrication|nanocharacterization"),F("Energy materials","battery materials|fuel-cell materials|photovoltaics|hydrogen storage|thermoelectrics"),F("Biomaterials","tissue scaffolds|biointerfaces|drug-delivery materials|biodegradable polymers|medical implants")]],
  ["earth_geosciences","Earth and Geosciences",[
    F("Geology","mineralogy|petrology|sedimentology|structural geology|geochronology"),F("Geophysics","seismology|geomagnetism|geodesy|Earth interior|exploration geophysics"),F("Tectonics and hazards","plate tectonics|earthquake physics|volcanology|landslides|tsunami science"),F("Hydrology and cryosphere","groundwater|watersheds|glaciology|permafrost|snow hydrology"),F("Paleoscience","paleontology|paleoclimatology|stratigraphy|mass extinctions|Earth-system history")]],
  ["climate_atmosphere","Climate and Atmospheric Science",[
    F("Atmospheric physics","radiative transfer|cloud microphysics|atmospheric dynamics|boundary layers|aerosols"),F("Weather science","synoptic meteorology|convective storms|tropical cyclones|weather prediction|extreme events"),F("Climate dynamics","climate variability|climate sensitivity|ocean-atmosphere coupling|monsoons|paleoclimate"),F("Climate change","attribution science|carbon budgets|sea-level rise|climate tipping points|regional projections"),F("Climate intervention","mitigation pathways|adaptation science|carbon removal|solar geoengineering|climate policy modeling")]],
  ["ocean_marine","Ocean and Marine Sciences",[
    F("Physical oceanography","ocean circulation|air-sea interaction|tides and waves|ocean mixing|polar oceans"),F("Chemical oceanography","marine carbon cycle|ocean acidification|nutrient cycling|trace metals|marine biogeochemistry"),F("Marine biology","plankton ecology|coral reefs|deep-sea biology|marine mammals|fisheries biology"),F("Marine geology","seafloor spreading|marine sediments|hydrothermal vents|continental margins|submarine hazards"),F("Ocean observation","ocean acoustics|autonomous floats|satellite oceanography|underwater robotics|ocean data assimilation")]],
  ["environment_ecology","Environmental Science and Ecology",[
    F("Ecosystem science","food webs|ecosystem productivity|nutrient cycles|disturbance ecology|restoration ecology"),F("Biodiversity","species diversity|functional diversity|conservation genetics|extinction risk|protected areas"),F("Pollution science","air pollution|water contamination|soil pollution|plastic pollution|ecotoxicology"),F("Environmental systems","land-use change|urban ecology|freshwater systems|biogeochemical cycles|ecosystem services"),F("Sustainability science","circular economy|life-cycle assessment|environmental justice|resource governance|planetary boundaries")]],
  ["organismal_biology","Organismal and Developmental Biology",[
    F("Cell biology","cell membranes|organelles|cell division|cytoskeleton|cell signaling"),F("Development","embryogenesis|pattern formation|cell differentiation|morphogenesis|regeneration"),F("Physiology","homeostasis|endocrine regulation|cardiovascular physiology|respiratory physiology|renal physiology"),F("Plant science","plant development|plant physiology|plant immunity|plant-microbe interactions|crop biology"),F("Comparative biology","comparative anatomy|functional morphology|animal behavior|life-history biology|adaptation")]],
  ["evolution_ecology","Evolutionary Biology",[
    F("Evolutionary theory","natural selection|genetic drift|mutation and variation|speciation|major evolutionary transitions"),F("Population biology","population genetics|quantitative genetics|demographic evolution|coalescent theory|evolutionary game theory"),F("Phylogenetics","molecular evolution|phylogenetic inference|ancestral reconstruction|divergence dating|comparative methods"),F("Evolutionary ecology","sexual selection|coevolution|host-parasite evolution|niche evolution|adaptive radiation"),F("Human evolution","hominin evolution|ancient DNA|cultural evolution|human population history|evolutionary medicine")]],
  ["genetics_genomics","Genetics Genomics and Epigenetics",[
    F("Classical genetics","Mendelian inheritance|linkage and recombination|cytogenetics|mutagenesis|complex traits"),F("Molecular genetics","gene structure|DNA replication|DNA repair|transcription|translation"),F("Genomics","genome assembly|comparative genomics|population genomics|functional genomics|pangenomics"),F("Epigenetics","DNA methylation|histone modification|chromatin organization|epigenetic inheritance|genomic imprinting"),F("Genome engineering","CRISPR systems|base editing|prime editing|gene drives|synthetic chromosomes")]],
  ["biochemistry_molecular","Biochemistry and Molecular Biology",[
    F("Protein science","protein structure|protein folding|enzyme catalysis|protein interactions|proteostasis"),F("Nucleic-acid biology","RNA structure|RNA processing|noncoding RNA|ribozymes|RNA regulation"),F("Metabolism","glycolysis|citric-acid cycle|oxidative phosphorylation|lipid metabolism|metabolic regulation"),F("Molecular signaling","receptors|kinase signaling|second messengers|transcriptional networks|cell-death pathways"),F("Structural biology","X-ray crystallography|nuclear magnetic resonance|cryo-electron microscopy|single-molecule biophysics|integrative modeling")]],
  ["microbiology_virology","Microbiology Virology and Immunology",[
    F("Bacteriology","bacterial physiology|microbial genetics|biofilms|antimicrobial resistance|bacterial pathogenesis"),F("Virology","viral entry|viral replication|virus evolution|host-virus interactions|emerging viruses"),F("Mycology and parasitology","fungal biology|fungal pathogenesis|protozoan parasites|helminths|vector biology"),F("Immunology","innate immunity|adaptive immunity|antibodies|T-cell biology|immune tolerance"),F("Microbiomes","gut microbiome|soil microbiome|marine microbiome|microbial ecology|metagenomics")]],
  ["neuroscience","Neuroscience and Neurobiology",[
    F("Cellular neuroscience","neurons and glia|action potentials|synaptic transmission|ion channels|neural development"),F("Systems neuroscience","sensory systems|motor systems|neural circuits|brain rhythms|connectomics"),F("Cognitive neuroscience","memory|attention|language in the brain|decision making|consciousness"),F("Computational neuroscience","neural coding|biophysical neuron models|population dynamics|predictive coding|reinforcement learning in brains"),F("Clinical neuroscience","neurodegeneration|epilepsy|psychiatric neuroscience|stroke|neurorehabilitation")]],
  ["cognitive_behavioral","Cognitive and Behavioral Sciences",[
    F("Cognitive psychology","perception|working memory|reasoning|learning|cognitive control"),F("Behavioral science","motivation|emotion|social cognition|behavioral decision making|individual differences"),F("Language and cognition","psycholinguistics|language acquisition|semantic memory|bilingual cognition|language evolution"),F("Consciousness studies","awareness|metacognition|sleep and dreaming|altered states|self representation"),F("Quantitative psychology","psychometrics|latent-variable models|experimental design|computational psychiatry|mathematical psychology")]],
  ["medical_health","Medical and Health Sciences",[
    F("Internal medicine","cardiology|endocrinology|gastroenterology|nephrology|pulmonology"),F("Oncology","tumor biology|cancer genomics|immuno-oncology|radiation oncology|precision oncology"),F("Regenerative medicine","stem cells|tissue engineering|organoids|cell therapy|transplantation"),F("Diagnostics","biomarkers|medical imaging|molecular diagnostics|liquid biopsy|clinical decision support"),F("Therapeutics","drug discovery|biologics|gene therapy|RNA therapeutics|personalized medicine")]],
  ["public_population_health","Public Health and Epidemiology",[
    F("Epidemiology","infectious-disease epidemiology|chronic-disease epidemiology|molecular epidemiology|causal epidemiology|surveillance"),F("Global health","health systems|maternal and child health|neglected diseases|health equity|pandemic preparedness"),F("Environmental health","occupational health|exposure science|toxicology|climate and health|urban health"),F("Biostatistics","clinical trials|survival analysis|longitudinal studies|meta-analysis|missing-data methods"),F("Health policy","health economics|implementation science|comparative effectiveness|quality improvement|digital health")]],
  ["computer_science","Computer Science",[
    F("Theory of computation","automata and languages|computability|complexity classes|randomized algorithms|approximation algorithms"),F("Software and languages","programming-language semantics|type systems|compiler construction|software verification|software architecture"),F("Computer systems","operating systems|distributed systems|computer networks|databases|cloud computing"),F("Security and privacy","cryptography|formal security|network security|privacy engineering|secure computation"),F("Human-centered computing","human-computer interaction|visualization|accessibility|computer-supported cooperation|social computing")]],
  ["ai_machine_learning","Artificial Intelligence and Machine Learning",[
    F("Machine learning theory","statistical learning|generalization|optimization for learning|representation learning|causal machine learning"),F("Deep learning","transformers|graph neural networks|generative models|self-supervised learning|multimodal learning"),F("Intelligent agents","reinforcement learning|planning|multi-agent systems|robot learning|embodied intelligence"),F("AI applications","computer vision|natural-language processing|speech processing|recommender systems|scientific machine learning"),F("AI safety and understanding","interpretability|robustness|alignment|fairness|uncertainty calibration")]],
  ["engineering_technology","Engineering and Technology",[
    F("Electrical engineering","circuits|signal processing|communications|control systems|power systems"),F("Mechanical engineering","solid mechanics|thermofluids|design engineering|manufacturing|tribology"),F("Civil engineering","structural engineering|geotechnical engineering|transportation|water resources|construction science"),F("Chemical engineering","transport phenomena|reactor design|separations|process control|industrial catalysis"),F("Robotics and autonomous systems","robot perception|motion planning|manipulation|swarm robotics|autonomous vehicles")]],
  ["quantum_technology","Quantum Science and Technology",[
    F("Quantum computing","quantum algorithms|quantum error correction|quantum architectures|quantum simulation|fault tolerance"),F("Quantum communication","quantum cryptography|quantum networks|entanglement distribution|quantum repeaters|device-independent protocols"),F("Quantum sensing","atomic clocks|quantum magnetometry|quantum imaging|inertial sensing|gravitational sensing"),F("Quantum materials","topological phases|quantum spin liquids|strongly correlated matter|moiré materials|unconventional superconductivity"),F("Quantum foundations","Bell nonlocality|contextuality|decoherence|quantum thermodynamics|macroscopic quantum states")]],
  ["agricultural_food_veterinary","Agricultural Food and Veterinary Sciences",[
    F("Crop science","plant breeding|crop genetics|soil fertility|precision agriculture|crop protection"),F("Animal and veterinary science","animal genetics|veterinary medicine|animal nutrition|zoonoses|animal welfare"),F("Food science","food chemistry|food microbiology|food processing|food safety|sensory science"),F("Agroecology","agrobiodiversity|sustainable farming|integrated pest management|agroforestry|soil health"),F("Bioeconomy","biorefineries|biomass conversion|agricultural biotechnology|food systems|circular bioeconomy")]],
  ["systems_complexity","Systems Complexity and Interdisciplinary Science",[
    F("Complex systems","emergence|self organization|criticality|adaptation|collective behavior"),F("Network science","network topology|community detection|diffusion on networks|temporal networks|multilayer networks"),F("Systems modeling","agent-based modeling|system dynamics|multiscale modeling|digital twins|uncertainty quantification"),F("Cybernetics and control","feedback|homeostasis|observability|resilience|adaptive control"),F("Science of science","bibliometrics|research networks|innovation dynamics|team science|metascience")]],
  ["social_sciences","Social and Economic Sciences",[
    F("Economics","microeconomics|macroeconomics|econometrics|behavioral economics|development economics"),F("Sociology","social stratification|organizations|culture|social networks|collective action"),F("Political science","political institutions|international relations|public policy|political behavior|governance"),F("Anthropology","cultural anthropology|biological anthropology|archaeology|human ecology|comparative ethnography"),F("Demography and human geography","fertility and mortality|migration|population aging|urbanization|spatial inequality")]],
  ["science_studies","Philosophy History and Methodology of Science",[
    F("Philosophy of science","scientific explanation|confirmation and evidence|realism and anti-realism|causation|models and representation"),F("History of science","ancient science|scientific revolution|history of medicine|history of technology|global histories of knowledge"),F("Research methodology","measurement|experimental inference|replication|open science|research ethics"),F("Scientific communication","peer review|scholarly publishing|data sharing|science journalism|public understanding of science"),F("Responsible innovation","technology assessment|bioethics|AI ethics|environmental ethics|participatory science")]]
];

const nodes=parseCSV(fs.readFileSync(path.join(here,"science_world_nodes.csv"),"utf8"));
const oldEdges=parseCSV(fs.readFileSync(path.join(here,"science_world_edges.csv"),"utf8"));
const edges=[]; const ids=new Set(nodes.map(n=>n.id)); const labels=new Map(nodes.map(n=>[n.label.toLowerCase(),n.id]));
nodes.forEach(n=>{n.status=n.status||"established";n.source_scope=n.source_scope||"curated core";});
function addNode(id,label,category,domain,discipline,level,importance,complexity,status,scope,description){id=`atlas_${slug(id)}`; if(ids.has(id)||labels.has(label.toLowerCase()))return labels.get(label.toLowerCase())||id; const n={id,label,category,domain,discipline,level,importance,complexity,status,source_scope:scope,description};nodes.push(n);ids.add(id);labels.set(label.toLowerCase(),id);return id;}
function family(detail){if(/part_of|contains|includes/.test(detail))return"structure";if(/support|ground|enable|language|formalized|precede|require/.test(detail))return"foundation";if(/explain|predict|model|implement|interpret/.test(detail))return"explanation";if(/produce|generate|drive|damage|modify|shape|regulate|catalyze|feed/.test(detail))return"process";if(/transcrib|translat|decode|measure|observe/.test(detail))return"information flow";if(/power|secure|analy|engineer|augment|control|application/.test(detail))return"application";if(/interact|couple|bridge|connect|consistent|contrast|relate/.test(detail))return"interaction";if(/general|unif|extend/.test(detail))return"generalization";return"association";}
function addEdge(source,target,detail,weight=.78,directed=true,provenance="atlas taxonomy"){if(!ids.has(source)||!ids.has(target)||source===target)return;edges.push({source,target,relation:family(detail),relation_detail:detail,weight,directed,relation_family:family(detail),provenance});}
oldEdges.forEach(e=>addEdge(e.source,e.target,e.relation,Number(e.weight),String(e.directed).toLowerCase()==="true","curated core"));

const lens=[
  ["theory","theoretical foundations","formal models assumptions and governing principles","established"],
  ["method","methods and instruments","measurement computation experiments and analytical methods","active"],
  ["research frontier","open questions","unresolved mechanisms limits anomalies and emerging research directions","frontier"],
  ["application","applications and implications","scientific technological clinical environmental or societal uses","active"]
];
const domainIds=[];
for(const [domainKey,domainLabel,fields] of catalog){
  const domainId=addNode(`${domainKey}_domain`,domainLabel,"discipline","science atlas",domainLabel,"foundational",10,7,"active","OECD/arXiv/NIH-aligned atlas","A broad research domain in the science atlas");domainIds.push(domainId);
  const fieldIds=[];
  for(const [fieldLabel,topics] of fields){
    const fieldId=addNode(`${domainKey}_${fieldLabel}`,fieldLabel,"field",domainLabel,fieldLabel,"intermediate",9,7,"active","discipline taxonomy",`A major research field within ${domainLabel}`);fieldIds.push(fieldId);addEdge(fieldId,domainId,"part_of",.96,true);
    const topicIds=[];
    for(const topicLabel of topics){
      const topicId=addNode(`${domainKey}_${fieldLabel}_${topicLabel}`,topicLabel,"topic",domainLabel,fieldLabel,"advanced",8,8,"active","subject taxonomy",`A scientific subject studied within ${fieldLabel}`);topicIds.push(topicId);addEdge(topicId,fieldId,"part_of",.94,true);
      for(const [category,suffix,description,status] of lens){const lensId=addNode(`${topicId}_${suffix}`,`${topicLabel}: ${suffix}`,category,domainLabel,fieldLabel,category==="research frontier"?"research":"advanced",category==="research frontier"?9:7,category==="research frontier"?10:8,status,"generated research lens",`${description} for ${topicLabel}`);addEdge(lensId,topicId,category==="application"?"application_of":category==="method"?"method_for":category==="theory"?"formalizes":"investigates",category==="research frontier"?.72:.82,true);}
    }
    for(let i=1;i<topicIds.length;i++)addEdge(topicIds[i-1],topicIds[i],"related_to",.62,false);
  }
  for(let i=1;i<fieldIds.length;i++)addEdge(fieldIds[i-1],fieldIds[i],"related_to",.66,false);
}
for(let i=1;i<domainIds.length;i++)addEdge(domainIds[i-1],domainIds[i],"bridges",.58,false);

const landmarks=`
theorem|Gödel incompleteness theorems|mathematical_sciences|Consistent effectively axiomatized arithmetic theories have intrinsic limitations
theorem|Compactness theorem|mathematical_sciences|Finite satisfiability controls satisfiability in first-order logic
theorem|Cantor diagonal theorem|mathematical_sciences|Diagonalization proves fundamental cardinality and computability results
theorem|Fundamental theorem of algebra|mathematical_sciences|Every nonconstant complex polynomial has a complex root
theorem|Fundamental theorem of arithmetic|mathematical_sciences|Integers have unique prime factorization up to order and units
theorem|Cayley theorem|mathematical_sciences|Every group is isomorphic to a permutation group
theorem|Lagrange theorem|mathematical_sciences|Subgroup order divides finite group order
theorem|Sylow theorems|mathematical_sciences|Prime-power subgroups constrain finite-group structure
theorem|Rank-nullity theorem|mathematical_sciences|Domain dimension decomposes into image and kernel dimensions
theorem|Spectral theorem|mathematical_sciences|Suitable operators admit orthogonal spectral representations
theorem|Hahn-Banach theorem|mathematical_sciences|Linear functionals extend under domination conditions
theorem|Banach fixed-point theorem|mathematical_sciences|Contractions on complete metric spaces have unique fixed points
theorem|Riesz representation theorem|mathematical_sciences|Continuous linear functionals admit canonical representations
theorem|Stone-Weierstrass theorem|mathematical_sciences|Appropriate function algebras uniformly approximate continuous functions
theorem|Radon-Nikodym theorem|mathematical_sciences|Absolutely continuous measures possess densities
theorem|Fubini theorem|mathematical_sciences|Integrability conditions permit iterated integration
theorem|Dominated convergence theorem|mathematical_sciences|Dominating integrable bounds justify exchanging limits and integrals
theorem|Stokes theorem|mathematical_sciences|Boundary integration and exterior differentiation are dual
theorem|Gauss-Bonnet theorem|mathematical_sciences|Curvature integrates to a topological invariant
theorem|Brouwer fixed-point theorem|mathematical_sciences|Continuous self-maps of compact convex balls have fixed points
theorem|Central limit theorem|probability_statistics|Normalized sums converge broadly toward Gaussian behavior
theorem|Law of large numbers|probability_statistics|Sample averages converge toward expected values
theorem|Bayes theorem|probability_statistics|Conditional probabilities update through likelihood and prior information
theorem|Neyman-Pearson lemma|probability_statistics|Likelihood-ratio tests optimize power for simple hypotheses
hypothesis|Riemann hypothesis|mathematical_sciences|Nontrivial zeta zeros are conjectured to have real part one half
conjecture|Birch and Swinnerton-Dyer conjecture|mathematical_sciences|Elliptic-curve rank is linked to an L-function zero
conjecture|Hodge conjecture|mathematical_sciences|Certain cohomology classes should arise from algebraic cycles
conjecture|P versus NP problem|computer_science|Whether efficiently verifiable problems are efficiently solvable remains unknown
theorem|Cook-Levin theorem|computer_science|Boolean satisfiability is NP-complete
theorem|CAP theorem|computer_science|Network partitions force a consistency-availability tradeoff
theorem|FLP impossibility result|computer_science|Deterministic consensus cannot be guaranteed asynchronously with one crash fault
thesis|Church-Turing thesis|computer_science|Effective computation is captured by equivalent formal models of computation
theorem|No-free-lunch theorems|ai_machine_learning|Averaged over all problems no optimizer has universal superiority
theorem|Universal approximation theorem|ai_machine_learning|Broad neural-network classes approximate continuous functions under stated conditions
theory|Newtonian mechanics|fundamental_physics|Classical motion follows forces masses and conservation principles
law|Maxwell equations|fundamental_physics|Classical electromagnetism is governed by coupled field equations
theory|Special relativity|fundamental_physics|Lorentz symmetry structures space time energy and momentum
theory|General relativity|fundamental_physics|Stress-energy and spacetime curvature are dynamically related
theory|Quantum mechanics|fundamental_physics|Physical states evolve and yield probabilistic measurement outcomes
theorem|Bell theorem|fundamental_physics|Local hidden-variable theories cannot reproduce all quantum correlations
theorem|Noether theorem|fundamental_physics|Continuous symmetries correspond to conserved quantities
theory|Quantum field theory|fundamental_physics|Quantum fields provide the framework for particles and interactions
theory|Standard Model of particle physics|fundamental_physics|Gauge theory describes known nongravitational elementary particles
hypothesis|Axion dark-matter hypothesis|astronomy_cosmology|Light pseudoscalar particles may constitute dark matter
hypothesis|Weakly interacting massive particle hypothesis|astronomy_cosmology|New weak-scale particles may constitute dark matter
theory|Cosmic inflation|astronomy_cosmology|Accelerated early expansion explains broad cosmological initial conditions
model|Lambda-CDM cosmology|astronomy_cosmology|Cold dark matter and a cosmological constant form the standard cosmological model
hypothesis|Primordial black-hole dark matter|astronomy_cosmology|Early-universe black holes may supply some dark matter
hypothesis|RNA world hypothesis|biochemistry_molecular|Early life may have relied on RNA for heredity and catalysis
theory|Cell theory|organismal_biology|Living organisms consist of cells arising from preexisting cells
theory|Theory of evolution by natural selection|evolution_ecology|Heritable differential reproduction changes populations
principle|Hardy-Weinberg principle|evolution_ecology|Idealized populations retain stable allele frequencies
theory|Neutral theory of molecular evolution|evolution_ecology|Much molecular change is driven by neutral drift
theory|Endosymbiotic theory|evolution_ecology|Mitochondria and chloroplasts descend from symbiotic bacteria
hypothesis|Red Queen hypothesis|evolution_ecology|Continual adaptation is needed under coevolutionary competition
theory|Central dogma of molecular biology|genetics_genomics|Sequence information conventionally flows from nucleic acid to protein
law|Mendel laws of inheritance|genetics_genomics|Segregation and independent assortment describe classical inheritance
theory|Chemiosmotic theory|biochemistry_molecular|Ion gradients couple electron transfer to ATP synthesis
principle|Le Chatelier principle|chemical_sciences|Equilibria respond to imposed changes by opposing them
law|Periodic law|chemical_sciences|Element properties recur with atomic number
theory|Valence-bond theory|chemical_sciences|Localized orbital overlap models chemical bonding
theory|Molecular-orbital theory|chemical_sciences|Molecular electrons occupy orbitals extending across nuclei
theory|Transition-state theory|chemical_sciences|Reaction rates depend on activated configurations
theory|Plate-tectonic theory|earth_geosciences|Lithospheric plates move and reorganize Earth surface
theory|Milankovitch theory|climate_atmosphere|Orbital variations pace components of long-term climate variability
hypothesis|Snowball Earth hypothesis|earth_geosciences|Earth may have experienced near-global glaciations
hypothesis|Gaia hypothesis|environment_ecology|Life and environment may form coupled self-regulating feedbacks
theory|Neuron doctrine|neuroscience|Nervous systems are composed of discrete signaling cells
model|Hodgkin-Huxley model|neuroscience|Conductance dynamics explain action-potential generation
principle|Hebbian learning principle|neuroscience|Correlated neural activity can strengthen synaptic coupling
theory|Global neuronal workspace theory|neuroscience|Global availability through broadcasting is proposed to support consciousness
theory|Integrated information theory|neuroscience|Consciousness is proposed to relate to integrated causal information
principle|Free-energy principle|neuroscience|Adaptive systems are modeled as minimizing variational free energy
hypothesis|Amyloid-cascade hypothesis|medical_health|Amyloid dysregulation is proposed as an upstream Alzheimer mechanism
theory|Germ theory of disease|medical_health|Specific microorganisms cause specific diseases
principle|Bradford Hill considerations|public_population_health|A structured set of considerations supports causal epidemiological judgment
theorem|Arrow impossibility theorem|social_sciences|No rank-order voting rule satisfies a stated set of fairness conditions simultaneously
theorem|Coase theorem|social_sciences|Under idealized conditions bargaining can internalize externalities
theorem|Nash equilibrium existence theorem|social_sciences|Finite games admit mixed-strategy equilibria
law|Zipf law|systems_complexity|Many ranked empirical quantities follow approximate inverse-frequency scaling
principle|Maximum entropy principle|systems_complexity|Constrained inference selects distributions with maximal entropy
theory|Information theory|systems_complexity|Entropy and mutual information quantify communication and dependence
`.trim().split("\n").map(line=>line.split("|"));
const domainByKey=new Map(catalog.map(([key,label],i)=>[key,domainIds[i]]));
for(const [category,label,parent,description] of landmarks){const id=addNode(`landmark_${label}`,label,category,"named scientific results","theories theorems and hypotheses",category==="hypothesis"||category==="conjecture"?"research":"advanced",10,10,category==="hypothesis"||category==="conjecture"?"open or active":"established","named landmark",description);addEdge(id,domainByKey.get(parent),"part_of",.93,true,"named landmark");}

const frontiers=`formalized mathematics|mathematical_sciences
Langlands program|mathematical_sciences
stochastic partial differential equations|mathematical_sciences
optimal transport in data science|mathematical_sciences
topological and geometric deep learning|mathematical_sciences
causal representation learning|probability_statistics
distribution-free uncertainty quantification|probability_statistics
high-dimensional causal inference|probability_statistics
privacy-preserving statistics|probability_statistics
foundation models for scientific data|ai_machine_learning
mechanistic interpretability|ai_machine_learning
neuro-symbolic AI|ai_machine_learning
embodied foundation models|ai_machine_learning
AI alignment science|ai_machine_learning
autonomous scientific discovery|ai_machine_learning
fault-tolerant quantum computation|quantum_technology
quantum repeaters|quantum_technology
quantum error-correcting codes|quantum_technology
moiré quantum matter|quantum_technology
topological quantum computation|quantum_technology
quantum gravity|fundamental_physics
neutrino mass ordering|fundamental_physics
dark-matter direct detection|fundamental_physics
matter-antimatter asymmetry|fundamental_physics
fusion plasma confinement|fundamental_physics
multi-messenger astronomy|astronomy_cosmology
exoplanet atmospheric biosignatures|astronomy_cosmology
fast radio burst origins|astronomy_cosmology
Hubble-tension resolution|astronomy_cosmology
first-galaxy formation|astronomy_cosmology
autonomous chemical laboratories|chemical_sciences
mechanochemistry|chemical_sciences
electrocatalytic carbon conversion|chemical_sciences
molecular machines|chemical_sciences
green ammonia synthesis|chemical_sciences
solid-state batteries|materials_science
perovskite photovoltaics|materials_science
high-temperature superconductivity|materials_science
programmable metamaterials|materials_science
direct-air-capture materials|materials_science
climate tipping-point detection|climate_atmosphere
ice-sheet instability|climate_atmosphere
event attribution science|climate_atmosphere
carbon dioxide removal|climate_atmosphere
solar-radiation modification assessment|climate_atmosphere
deep-ocean carbon sequestration|ocean_marine
marine heatwave prediction|ocean_marine
autonomous ocean observing systems|ocean_marine
coral-reef resilience|ocean_marine
deep-sea ecosystem mapping|ocean_marine
planetary-boundary interactions|environment_ecology
biodiversity tipping points|environment_ecology
microplastic ecosystem effects|environment_ecology
nature-based climate solutions|environment_ecology
environmental DNA monitoring|environment_ecology
pangenome references|genetics_genomics
single-cell multiomics|genetics_genomics
spatial transcriptomics|genetics_genomics
prime and base genome editing|genetics_genomics
synthetic chromosomes|genetics_genomics
de novo protein design|biochemistry_molecular
protein language models|biochemistry_molecular
biomolecular condensates|biochemistry_molecular
single-molecule structural dynamics|biochemistry_molecular
minimal synthetic cells|biochemistry_molecular
microbiome therapeutics|microbiology_virology
phage therapy|microbiology_virology
antimicrobial-resistance evolution|microbiology_virology
universal vaccine platforms|microbiology_virology
viral emergence forecasting|microbiology_virology
whole-brain connectomics|neuroscience
closed-loop neurostimulation|neuroscience
high-bandwidth brain-computer interfaces|neuroscience
neural organoids|neuroscience
computational theories of consciousness|neuroscience
precision oncology|medical_health
CAR-T therapy for solid tumors|medical_health
RNA therapeutic platforms|medical_health
xenotransplantation|medical_health
aging biomarkers and interventions|medical_health
pandemic early-warning systems|public_population_health
wastewater epidemiology|public_population_health
long-COVID mechanisms|public_population_health
climate-health attribution|public_population_health
digital public-health surveillance|public_population_health
digital twins for engineering|engineering_technology
swarm autonomy|engineering_technology
soft robotics|engineering_technology
green hydrogen systems|engineering_technology
negative-emission process engineering|engineering_technology
precision agriculture|agricultural_food_veterinary
climate-resilient crops|agricultural_food_veterinary
cultivated meat|agricultural_food_veterinary
soil microbiome engineering|agricultural_food_veterinary
One Health surveillance|agricultural_food_veterinary
multilayer network dynamics|systems_complexity
resilience of interdependent systems|systems_complexity
collective-intelligence science|systems_complexity
digital-twin ecosystems|systems_complexity
complexity-aware policy design|systems_complexity
computational social science|social_sciences
algorithmic governance|social_sciences
misinformation diffusion|social_sciences
network polarization|social_sciences
causal policy evaluation|social_sciences`.trim().split("\n").map(x=>x.split("|"));
for(const [label,parent] of frontiers){const id=addNode(`frontier_${label}`,label,"research frontier","frontier research",catalog.find(x=>x[0]===parent)?.[1]||parent,"research",9,10,"frontier","cross-disciplinary frontier watch","An active or emerging research direction");addEdge(id,domainByKey.get(parent),"investigates",.7,true,"frontier watch");}

const uniqueEdges=new Map(); for(const e of edges){const pair=e.directed?`${e.source}>${e.target}`:[e.source,e.target].sort().join("~");const key=`${pair}|${e.relation}`;if(!uniqueEdges.has(key))uniqueEdges.set(key,e);}
const finalEdges=[...uniqueEdges.values()]; for(const e of finalEdges)if(!ids.has(e.source)||!ids.has(e.target))throw Error(`Unknown endpoint ${e.source} -> ${e.target}`);
const nodeHeaders=["id","label","category","domain","discipline","level","importance","complexity","status","source_scope","description"];
const edgeHeaders=["source","target","relation","relation_detail","weight","directed","relation_family","provenance"];
fs.writeFileSync(path.join(here,"science_world_nodes.csv"),csv(nodes,nodeHeaders));fs.writeFileSync(path.join(here,"science_world_edges.csv"),csv(finalEdges,edgeHeaders));

// Partition the atlas into independently importable semantic modules. Every
// node belongs to exactly one module. Internal relations stay with that module;
// relations crossing module boundaries are collected in the bridge pair.
const moduleDir=path.join(here,"science_modules");fs.mkdirSync(moduleDir,{recursive:true});
for(const file of fs.readdirSync(moduleDir))if(file.endsWith(".csv"))fs.unlinkSync(path.join(moduleDir,file));
const labelToKey=new Map(catalog.map(([key,label])=>[label,key]));
const moduleByNode=new Map();
catalog.forEach(([key],i)=>moduleByNode.set(domainIds[i],key));
for(const node of nodes){if(labelToKey.has(node.domain))moduleByNode.set(node.id,labelToKey.get(node.domain));else if(labelToKey.has(node.discipline))moduleByNode.set(node.id,labelToKey.get(node.discipline));}

const semanticSeeds={
  mathematical_sciences:["mathematics","logic","set_theory","category_theory","linear_algebra","abstract_algebra","number_theory","calculus","real_analysis","topology","differential_geometry","optimization","numerical_analysis"],
  probability_statistics:["probability","statistics","bayesian_inference","causal_inference"],
  fundamental_physics:["physics","classical_mechanics","thermodynamics","statistical_mechanics","electromagnetism","optics","standard_model","particle_physics","nuclear_physics","fluid_dynamics","plasma_physics","wave_particle_duality","symmetry_breaking"],
  astronomy_cosmology:["astronomy","black_holes","gravitational_waves","stellar_evolution","cosmology","big_bang","dark_matter","dark_energy","galaxy_dynamics","exoplanets"],
  chemical_sciences:["chemistry","molecular_dynamics","chemical_bonding","reaction_kinetics","quantum_chemistry"],
  materials_science:["condensed_matter"],
  earth_geosciences:["earth_science","plate_tectonics","remote_sensing"],
  climate_atmosphere:["climate_system","carbon_cycle"],
  ocean_marine:["ocean_circulation"],
  environment_ecology:["ecology"],
  organismal_biology:["biology","developmental_biology","homeostasis"],
  evolution_ecology:["natural_selection","population_genetics"],
  genetics_genomics:["genetics","gene","genome","gene_regulation"],
  biochemistry_molecular:["biochemistry","molecular_biology","dna","rna","protein","enzyme","atp","cellular_respiration","photosynthesis","protein_folding"],
  microbiology_virology:["microbiology"],
  neuroscience:["neuroscience","neurobiology","neuron","synapse","action_potential","neurotransmitter","neural_plasticity","hebbian_learning","predictive_coding","neural_coding","connectome","brain_networks","glia","brain_computer_interface","fmri","eeg","neurodegeneration"],
  cognitive_behavioral:["memory","attention","consciousness","vision","motor_control"],
  medical_health:["medicine","medical_imaging","systems_medicine"],
  computer_science:["computer_science","algorithms","data_structures","computability","complexity_theory","programming_languages","operating_systems","distributed_systems","databases","cryptography","computer_networks"],
  ai_machine_learning:["artificial_intelligence","machine_learning","deep_learning","reinforcement_learning","computer_vision","natural_language_processing","transformers","graph_neural_networks"],
  engineering_technology:["engineering","robotics","control_theory"],
  quantum_technology:["quantum_computing"],
  systems_complexity:["systems_science","systems_biology","synthetic_biology","bioinformatics","nonlinear_dynamics","emergence","agent_based_modeling","computational_modeling","information_theory"],
  science_studies:["scientific_method","measurement"]
};
for(const [key,seeds] of Object.entries(semanticSeeds))for(const id of seeds)if(ids.has(id))moduleByNode.set(id,key);

// Propagate classifications only to legacy nodes that remain unassigned.
const adjacency=new Map(nodes.map(n=>[n.id,[]]));
for(const edge of finalEdges){adjacency.get(edge.source)?.push(edge.target);adjacency.get(edge.target)?.push(edge.source);}
const queue=[...moduleByNode.keys()];
for(let cursor=0;cursor<queue.length;cursor++){const id=queue[cursor],key=moduleByNode.get(id);for(const neighbor of adjacency.get(id)||[])if(!moduleByNode.has(neighbor)){moduleByNode.set(neighbor,key);queue.push(neighbor);}}
for(const node of nodes)if(!moduleByNode.has(node.id))moduleByNode.set(node.id,"systems_complexity");

const nodesByModule=new Map(catalog.map(([key])=>[key,[]]));
const edgesByModule=new Map(catalog.map(([key])=>[key,[]]));
for(const node of nodes)nodesByModule.get(moduleByNode.get(node.id)).push(node);
const bridgeEdges=[];
for(const edge of finalEdges){const sourceModule=moduleByNode.get(edge.source),targetModule=moduleByNode.get(edge.target);if(sourceModule===targetModule)edgesByModule.get(sourceModule).push(edge);else bridgeEdges.push(edge);}
const bridgeIds=new Set(bridgeEdges.flatMap(edge=>[edge.source,edge.target]));
const bridgeNodes=nodes.filter(node=>bridgeIds.has(node.id));
const manifest=[];
for(const [key,label] of catalog){const moduleNodes=nodesByModule.get(key),moduleEdges=edgesByModule.get(key),incidentBridges=bridgeEdges.filter(edge=>moduleByNode.get(edge.source)===key||moduleByNode.get(edge.target)===key).length;const nodesFile=`${key}_nodes.csv`,edgesFile=`${key}_edges.csv`;fs.writeFileSync(path.join(moduleDir,nodesFile),csv(moduleNodes,nodeHeaders));fs.writeFileSync(path.join(moduleDir,edgesFile),csv(moduleEdges,edgeHeaders));manifest.push({module_key:key,domain_label:label,nodes_file:nodesFile,edges_file:edgesFile,node_count:moduleNodes.length,internal_edge_count:moduleEdges.length,cross_domain_edge_count:incidentBridges});}
fs.writeFileSync(path.join(moduleDir,"cross_domain_nodes.csv"),csv(bridgeNodes,nodeHeaders));
const annotatedBridgeEdges=bridgeEdges.map(edge=>({...edge,source_module:moduleByNode.get(edge.source),target_module:moduleByNode.get(edge.target)}));
fs.writeFileSync(path.join(moduleDir,"cross_domain_edges.csv"),csv(annotatedBridgeEdges,[...edgeHeaders,"source_module","target_module"]));
manifest.push({module_key:"cross_domain_bridges",domain_label:"Cross-domain bridges",nodes_file:"cross_domain_nodes.csv",edges_file:"cross_domain_edges.csv",node_count:bridgeNodes.length,internal_edge_count:bridgeEdges.length,cross_domain_edge_count:bridgeEdges.length});
fs.writeFileSync(path.join(moduleDir,"module_manifest.csv"),csv(manifest,["module_key","domain_label","nodes_file","edges_file","node_count","internal_edge_count","cross_domain_edge_count"]));

console.log(JSON.stringify({nodes:nodes.length,edges:finalEdges.length,domains:new Set(nodes.map(n=>n.domain)).size,disciplines:new Set(nodes.map(n=>n.discipline)).size,categories:new Set(nodes.map(n=>n.category)).size,frontiers:nodes.filter(n=>n.category==="research frontier").length,landmarks:nodes.filter(n=>["theorem","theory","hypothesis","conjecture","law","principle","thesis","model"].includes(n.category)).length,modules:catalog.length,bridgeNodes:bridgeNodes.length,bridgeEdges:bridgeEdges.length}));
