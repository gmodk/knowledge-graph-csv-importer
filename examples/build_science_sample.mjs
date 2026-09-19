import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const nodes = [];
const edges = [];
const add = (id, label, category, domain, discipline, level, importance, complexity, description) => nodes.push({ id, label, category, domain, discipline, level, importance, complexity, description });
const link = (source, target, relation, weight = .8, directed = true) => edges.push({ source, target, relation, weight, directed });

// Discipline hubs
[
  ["mathematics","Mathematics","formal science"],["physics","Physics","natural science"],["computer_science","Computer Science","formal science"],
  ["biology","Biology","life science"],["chemistry","Chemistry","natural science"],["biochemistry","Biochemistry","life science"],
  ["neurobiology","Neurobiology","life science"],["neuroscience","Neuroscience","life science"],["earth_science","Earth Science","natural science"],
  ["astronomy","Astronomy and Cosmology","natural science"],["systems_science","Systems Science","interdisciplinary science"],
  ["medicine","Medicine","applied science"],["engineering","Engineering","applied science"]
].forEach(([id,label,domain]) => add(id,label,"discipline",domain,label,"foundational",10,8,`A major scientific discipline centered on ${label.toLowerCase()}.`));

// Mathematics
[
  ["logic","Mathematical Logic","field","Logic","foundational",9,7,"Formal reasoning proof and mathematical truth"],
  ["set_theory","Set Theory","theory","Foundations","foundational",9,7,"Sets relations functions cardinality and foundations"],
  ["category_theory","Category Theory","theory","Foundations","advanced",8,10,"Objects morphisms functors and natural transformations"],
  ["linear_algebra","Linear Algebra","field","Algebra","foundational",10,6,"Vector spaces linear maps eigenvalues and tensors"],
  ["abstract_algebra","Abstract Algebra","field","Algebra","intermediate",9,8,"Groups rings fields modules and symmetries"],
  ["group_theory","Group Theory","theory","Algebra","intermediate",9,8,"Algebraic study of symmetry"],
  ["ring_theory","Ring Theory","theory","Algebra","advanced",7,9,"Algebraic systems with addition and multiplication"],
  ["number_theory","Number Theory","field","Number Theory","intermediate",8,8,"Arithmetic properties of integers and related structures"],
  ["calculus","Calculus","field","Analysis","foundational",10,6,"Change accumulation derivatives and integrals"],
  ["real_analysis","Real Analysis","field","Analysis","intermediate",9,8,"Rigorous study of limits continuity measure and integration"],
  ["complex_analysis","Complex Analysis","field","Analysis","advanced",8,8,"Analysis of complex-valued functions"],
  ["functional_analysis","Functional Analysis","field","Analysis","advanced",9,10,"Infinite-dimensional vector spaces and operators"],
  ["differential_equations","Differential Equations","field","Analysis","intermediate",10,8,"Equations relating functions to their derivatives"],
  ["dynamical_systems","Dynamical Systems","theory","Applied Mathematics","advanced",9,9,"Evolution stability attractors and chaos"],
  ["probability","Probability Theory","theory","Probability","intermediate",10,8,"Mathematics of uncertainty and random phenomena"],
  ["statistics","Statistics","field","Statistics","intermediate",10,7,"Inference estimation testing and data modeling"],
  ["bayesian_inference","Bayesian Inference","method","Statistics","advanced",9,8,"Updating probability distributions using evidence"],
  ["information_theory","Information Theory","theory","Applied Mathematics","advanced",10,9,"Entropy coding information and communication limits"],
  ["graph_theory","Graph Theory","theory","Discrete Mathematics","intermediate",9,7,"Vertices edges networks paths and connectivity"],
  ["topology","Topology","field","Geometry and Topology","advanced",8,9,"Properties invariant under continuous deformation"],
  ["differential_geometry","Differential Geometry","field","Geometry and Topology","advanced",9,10,"Smooth manifolds curvature and geometric structure"],
  ["tda","Topological Data Analysis","method","Applied Mathematics","research",8,10,"Shape analysis using persistent topological features"],
  ["optimization","Optimization","field","Applied Mathematics","intermediate",10,8,"Selecting extrema subject to constraints"],
  ["game_theory","Game Theory","theory","Applied Mathematics","advanced",7,8,"Strategic interaction among decision makers"],
  ["numerical_analysis","Numerical Analysis","field","Applied Mathematics","advanced",9,8,"Approximation algorithms and computational error"]
].forEach(([id,label,category,discipline,level,importance,complexity,description]) => add(id,label,category,"formal science",discipline,level,importance,complexity,description));

// Physics and astronomy
[
  ["classical_mechanics","Classical Mechanics","theory","Mechanics","foundational",10,7,"Motion forces energy and momentum"],
  ["thermodynamics","Thermodynamics","theory","Thermal Physics","intermediate",10,8,"Heat work temperature entropy and equilibrium"],
  ["statistical_mechanics","Statistical Mechanics","theory","Thermal Physics","advanced",10,9,"Macroscopic behavior derived from microscopic ensembles"],
  ["electromagnetism","Electromagnetism","theory","Field Theory","intermediate",10,8,"Electric magnetic fields charges and radiation"],
  ["optics","Optics","field","Electromagnetism","intermediate",8,7,"Propagation and interaction of light"],
  ["special_relativity","Special Relativity","theory","Relativity","advanced",10,8,"Spacetime invariance at constant relative velocity"],
  ["general_relativity","General Relativity","theory","Relativity","advanced",10,10,"Gravitation as curved spacetime"],
  ["quantum_mechanics","Quantum Mechanics","theory","Quantum Physics","advanced",10,10,"States observables amplitudes and quantum measurement"],
  ["quantum_field_theory","Quantum Field Theory","theory","Quantum Physics","research",10,10,"Quantum fields particles and interactions"],
  ["standard_model","Standard Model","theory","Particle Physics","research",10,10,"Quantum theory of known elementary particles and forces"],
  ["particle_physics","Particle Physics","field","High Energy Physics","advanced",9,9,"Fundamental particles and interactions"],
  ["nuclear_physics","Nuclear Physics","field","Nuclear Science","advanced",8,9,"Atomic nuclei radioactivity and nuclear reactions"],
  ["condensed_matter","Condensed Matter Physics","field","Matter Physics","advanced",9,9,"Collective properties of solids and liquids"],
  ["fluid_dynamics","Fluid Dynamics","field","Continuum Mechanics","advanced",9,8,"Flow of liquids gases and plasmas"],
  ["plasma_physics","Plasma Physics","field","Matter Physics","advanced",8,9,"Ionized matter and collective electromagnetic behavior"],
  ["nonlinear_dynamics","Nonlinear Dynamics and Chaos","theory","Complex Systems","advanced",9,9,"Nonlinear evolution sensitivity and strange attractors"],
  ["wave_particle_duality","Wave-Particle Duality","principle","Quantum Physics","advanced",9,8,"Quantum entities display wave-like and particle-like behavior"],
  ["symmetry_breaking","Symmetry Breaking","process","Field Theory","research",9,9,"A system state has less symmetry than its governing laws"],
  ["black_holes","Black Holes","object","Astrophysics","advanced",10,9,"Compact regions bounded by event horizons"],
  ["gravitational_waves","Gravitational Waves","phenomenon","Astrophysics","advanced",9,9,"Propagating perturbations of spacetime curvature"],
  ["stellar_evolution","Stellar Evolution","process","Astrophysics","advanced",8,8,"Birth life and death of stars"],
  ["cosmology","Physical Cosmology","field","Cosmology","advanced",10,10,"Origin structure evolution and fate of the universe"],
  ["big_bang","Big Bang Model","theory","Cosmology","advanced",9,9,"Hot dense early-universe cosmological model"],
  ["dark_matter","Dark Matter","hypothesis","Cosmology","research",9,9,"Nonluminous matter inferred from gravitational effects"],
  ["dark_energy","Dark Energy","hypothesis","Cosmology","research",9,10,"Component associated with accelerated cosmic expansion"],
  ["galaxy_dynamics","Galaxy Dynamics","field","Astrophysics","advanced",8,9,"Motion and mass distribution within gravitationally bound galaxies"],
  ["exoplanets","Exoplanets","object","Planetary Science","intermediate",7,6,"Planets orbiting stars beyond the Solar System"]
].forEach(([id,label,category,discipline,level,importance,complexity,description]) => add(id,label,category,"natural science",discipline,level,importance,complexity,description));

// Computer science and engineering
[
  ["algorithms","Algorithms","field","Theoretical Computer Science","foundational",10,7,"Finite procedures for computation and problem solving"],
  ["data_structures","Data Structures","technology","Computer Systems","foundational",9,6,"Representations organizing data for computation"],
  ["computability","Computability Theory","theory","Theoretical Computer Science","advanced",9,9,"Formal limits of algorithmic computation"],
  ["complexity_theory","Computational Complexity","theory","Theoretical Computer Science","advanced",9,9,"Resources required to solve computational problems"],
  ["programming_languages","Programming Languages","field","Software Systems","intermediate",8,7,"Syntax semantics type systems and program execution"],
  ["operating_systems","Operating Systems","technology","Computer Systems","intermediate",8,8,"Resource management and abstraction for computers"],
  ["distributed_systems","Distributed Systems","field","Computer Systems","advanced",9,9,"Computation coordinated across networked machines"],
  ["databases","Database Systems","field","Information Systems","intermediate",9,7,"Persistent structured data storage and querying"],
  ["cryptography","Cryptography","field","Security","advanced",9,9,"Secure communication using mathematical constructions"],
  ["computer_networks","Computer Networks","field","Computer Systems","intermediate",8,7,"Protocols and architectures for communicating computers"],
  ["artificial_intelligence","Artificial Intelligence","field","Artificial Intelligence","intermediate",10,8,"Computational systems performing intelligent tasks"],
  ["machine_learning","Machine Learning","field","Artificial Intelligence","advanced",10,8,"Learning predictive or decision rules from data"],
  ["deep_learning","Deep Learning","field","Artificial Intelligence","advanced",10,9,"Representation learning with multilayer neural networks"],
  ["reinforcement_learning","Reinforcement Learning","method","Artificial Intelligence","advanced",9,9,"Learning behavior from rewards and interaction"],
  ["computer_vision","Computer Vision","field","Artificial Intelligence","advanced",9,8,"Computational interpretation of visual information"],
  ["natural_language_processing","Natural Language Processing","field","Artificial Intelligence","advanced",9,8,"Computational modeling and processing of language"],
  ["transformers","Transformer Architecture","technology","Artificial Intelligence","research",10,9,"Attention-based neural network architecture"],
  ["graph_neural_networks","Graph Neural Networks","technology","Artificial Intelligence","research",9,9,"Neural computation on graph-structured data"],
  ["quantum_computing","Quantum Computing","field","Computing Paradigms","research",9,10,"Computation using controllable quantum systems"],
  ["robotics","Robotics","field","Autonomous Systems","advanced",9,8,"Sensing planning control and embodied machines"],
  ["control_theory","Control Theory","theory","Systems Engineering","advanced",9,9,"Feedback stability observability and control of dynamical systems"]
].forEach(([id,label,category,discipline,level,importance,complexity,description]) => add(id,label,category,"formal and applied science",discipline,level,importance,complexity,description));

// Biology, chemistry, and biochemistry
[
  ["cell_biology","Cell Biology","field","Cellular Biology","foundational",10,7,"Structure function and behavior of cells"],
  ["molecular_biology","Molecular Biology","field","Molecular Biology","intermediate",10,8,"Molecular mechanisms of biological information and function"],
  ["genetics","Genetics","field","Genetics","intermediate",10,8,"Inheritance variation and genome function"],
  ["evolution","Evolutionary Biology","theory","Evolution","intermediate",10,8,"Change in heritable populations across generations"],
  ["ecology","Ecology","field","Ecology","intermediate",9,7,"Interactions among organisms and environments"],
  ["developmental_biology","Developmental Biology","field","Development","advanced",8,8,"Growth differentiation and organismal development"],
  ["immunology","Immunology","field","Immunology","advanced",9,9,"Biological defense recognition and immune regulation"],
  ["microbiology","Microbiology","field","Microbiology","intermediate",9,7,"Microorganisms and their biological activities"],
  ["virology","Virology","field","Microbiology","advanced",8,8,"Viruses their replication and host interactions"],
  ["systems_biology","Systems Biology","field","Systems Biology","research",9,9,"Integrated modeling of interacting biological components"],
  ["synthetic_biology","Synthetic Biology","technology","Bioengineering","research",8,9,"Design and construction of biological systems"],
  ["bioinformatics","Bioinformatics","field","Computational Biology","advanced",9,8,"Computational analysis of biological data"],
  ["population_genetics","Population Genetics","theory","Evolution","advanced",8,9,"Allele-frequency dynamics in populations"],
  ["epigenetics","Epigenetics","field","Genetics","advanced",9,8,"Heritable regulation beyond DNA sequence changes"],
  ["homeostasis","Homeostasis","process","Physiology","foundational",9,6,"Regulation maintaining viable internal conditions"],
  ["natural_selection","Natural Selection","process","Evolution","intermediate",10,7,"Differential reproductive success from heritable variation"],
  ["gene_regulation","Gene Regulation","process","Molecular Biology","advanced",10,8,"Control of gene expression across contexts"],
  ["dna","DNA","molecule","Molecular Biology","foundational",10,5,"Polymer encoding hereditary information"],
  ["rna","RNA","molecule","Molecular Biology","foundational",9,5,"Polymer supporting information transfer regulation and catalysis"],
  ["protein","Proteins","molecule","Molecular Biology","foundational",10,6,"Functional polymers of amino acids"],
  ["gene","Gene","information structure","Genetics","foundational",10,5,"Heritable genomic unit contributing to function"],
  ["genome","Genome","information structure","Genetics","intermediate",9,6,"Complete genetic material of an organism"],
  ["metabolism","Metabolism","process","Biochemistry","intermediate",10,8,"Chemical reaction networks sustaining life"],
  ["enzyme","Enzymes","molecule","Biochemistry","intermediate",10,7,"Biological catalysts controlling reaction rates"],
  ["atp","ATP","molecule","Biochemistry","foundational",9,5,"Nucleotide coupling energy-releasing and energy-consuming processes"],
  ["cellular_respiration","Cellular Respiration","process","Biochemistry","intermediate",9,7,"Biochemical extraction of energy from nutrients"],
  ["photosynthesis","Photosynthesis","process","Biochemistry","intermediate",9,8,"Conversion of light energy into chemical energy"],
  ["protein_folding","Protein Folding","process","Structural Biology","advanced",9,9,"Formation of functional protein conformations"],
  ["molecular_dynamics","Molecular Dynamics","method","Computational Chemistry","advanced",8,9,"Numerical simulation of atomic motion"],
  ["chemical_bonding","Chemical Bonding","theory","Physical Chemistry","foundational",10,7,"Electronic interactions stabilizing atoms and molecules"],
  ["reaction_kinetics","Chemical Kinetics","theory","Physical Chemistry","intermediate",9,8,"Rates and mechanisms of chemical reactions"],
  ["quantum_chemistry","Quantum Chemistry","field","Physical Chemistry","advanced",9,10,"Quantum-mechanical description of molecular systems"],
  ["organic_chemistry","Organic Chemistry","field","Chemistry","intermediate",9,8,"Structure reactions and synthesis of carbon compounds"]
].forEach(([id,label,category,discipline,level,importance,complexity,description]) => add(id,label,category,discipline === "Biochemistry" || ["dna","rna","protein","enzyme","atp","metabolism","cellular_respiration","photosynthesis","protein_folding","molecular_dynamics"].includes(id) ? "life science" : "natural and life science",discipline,level,importance,complexity,description));

// Neurobiology, neuroscience, medicine, Earth science, and interdisciplinary methods
[
  ["neuron","Neuron","cell","Cellular Neurobiology","foundational",10,6,"Electrically excitable signaling cell of nervous systems"],
  ["synapse","Synapse","structure","Cellular Neurobiology","intermediate",10,7,"Junction transmitting signals between cells"],
  ["action_potential","Action Potential","process","Cellular Neurobiology","intermediate",10,7,"Regenerative electrical signal across a cell membrane"],
  ["neurotransmitter","Neurotransmitters","molecule","Molecular Neurobiology","intermediate",9,7,"Chemical messengers released at synapses"],
  ["neural_plasticity","Neural Plasticity","process","Systems Neuroscience","advanced",10,9,"Experience-dependent change in neural structure or function"],
  ["hebbian_learning","Hebbian Learning","principle","Computational Neuroscience","advanced",9,8,"Activity-dependent strengthening of coupled neurons"],
  ["predictive_coding","Predictive Coding","theory","Computational Neuroscience","research",8,9,"Hierarchical inference minimizing prediction error"],
  ["neural_coding","Neural Coding","field","Computational Neuroscience","advanced",9,9,"Representation and transformation of information by neural activity"],
  ["connectome","Connectome","information structure","Systems Neuroscience","research",8,8,"Map of structural or functional neural connections"],
  ["brain_networks","Brain Networks","field","Network Neuroscience","research",9,9,"Graph-structured organization of interacting brain regions"],
  ["memory","Memory","process","Cognitive Neuroscience","advanced",10,9,"Encoding consolidation storage and retrieval of information"],
  ["attention","Attention","process","Cognitive Neuroscience","advanced",9,8,"Selective prioritization of information processing"],
  ["consciousness","Consciousness","phenomenon","Cognitive Neuroscience","research",10,10,"Subjective awareness and integrated experience"],
  ["vision","Visual Perception","process","Sensory Neuroscience","advanced",9,8,"Neural interpretation of visual signals"],
  ["motor_control","Motor Control","process","Systems Neuroscience","advanced",8,8,"Neural planning and regulation of movement"],
  ["glia","Glial Cells","cell","Cellular Neurobiology","intermediate",8,7,"Non-neuronal cells supporting and modulating nervous systems"],
  ["brain_computer_interface","Brain-Computer Interface","technology","Neuroengineering","research",8,9,"Direct communication between neural activity and external devices"],
  ["fmri","Functional MRI","method","Neuroimaging","advanced",8,8,"Indirect measurement of brain activity using hemodynamic signals"],
  ["eeg","Electroencephalography","method","Neuroimaging","intermediate",8,7,"Measurement of scalp electrical potentials generated by neural activity"],
  ["neurodegeneration","Neurodegeneration","process","Neurology","research",9,9,"Progressive loss of neuronal structure or function"],
  ["climate_system","Climate System","system","Climate Science","advanced",10,9,"Coupled atmosphere ocean ice land and biosphere"],
  ["plate_tectonics","Plate Tectonics","theory","Geology","intermediate",9,7,"Dynamics of lithospheric plates and planetary crust"],
  ["carbon_cycle","Carbon Cycle","process","Earth System Science","intermediate",9,7,"Exchange of carbon among planetary reservoirs"],
  ["ocean_circulation","Ocean Circulation","process","Oceanography","advanced",8,8,"Large-scale transport of water heat nutrients and carbon"],
  ["remote_sensing","Remote Sensing","method","Earth Observation","advanced",8,7,"Measurement of distant systems using electromagnetic signals"],
  ["network_science","Network Science","field","Complex Systems","advanced",10,8,"Study of structure dynamics and function in networks"],
  ["complex_systems","Complex Systems","field","Systems Science","advanced",10,9,"Collective behavior emerging from interacting components"],
  ["emergence","Emergence","principle","Systems Science","advanced",9,9,"Macroscopic organization not reducible to isolated components"],
  ["agent_based_modeling","Agent-Based Modeling","method","Systems Science","advanced",8,8,"Simulation of interacting autonomous agents"],
  ["scientific_method","Scientific Method","method","Philosophy of Science","foundational",10,5,"Evidence-based hypothesis testing modeling and revision"],
  ["measurement","Measurement Theory","field","Metrology","advanced",9,8,"Representation calibration uncertainty and interpretation of measurement"],
  ["causal_inference","Causal Inference","method","Data Science","advanced",10,9,"Reasoning about interventions and cause-effect structure"],
  ["computational_modeling","Computational Modeling","method","Scientific Computing","advanced",10,8,"Computer-based representation and simulation of systems"],
  ["medical_imaging","Medical Imaging","technology","Biomedical Engineering","advanced",8,8,"Noninvasive visualization of anatomy and physiology"],
  ["genomics","Genomics","field","Precision Medicine","advanced",9,8,"Large-scale analysis of genomes and their function"],
  ["epidemiology","Epidemiology","field","Population Health","intermediate",9,7,"Distribution determinants and control of health events"],
  ["systems_medicine","Systems Medicine","field","Systems Medicine","research",8,9,"Network and multiscale analysis of disease and treatment"]
].forEach(([id,label,category,discipline,level,importance,complexity,description]) => {
  const domain = ["neuron","synapse","action_potential","neurotransmitter","neural_plasticity","glia","neurodegeneration"].includes(id) ? "life science" : ["climate_system","plate_tectonics","carbon_cycle","ocean_circulation","remote_sensing"].includes(id) ? "natural science" : ["medical_imaging","genomics","epidemiology","systems_medicine"].includes(id) ? "applied science" : "interdisciplinary science";
  add(id,label,category,domain,discipline,level,importance,complexity,description);
});

// Assign every non-hub concept to a discipline hub.
const hubFor = n => {
  if (n.domain === "formal science") return "mathematics";
  if (n.domain === "formal and applied science") return n.id === "control_theory" || n.id === "robotics" ? "engineering" : "computer_science";
  if (["Physics","Mechanics","Thermal Physics","Field Theory","Electromagnetism","Relativity","Quantum Physics","Particle Physics","High Energy Physics","Nuclear Science","Matter Physics","Continuum Mechanics","Complex Systems"].includes(n.discipline)) return "physics";
  if (["Astrophysics","Cosmology","Planetary Science"].includes(n.discipline)) return "astronomy";
  if (["Cellular Neurobiology","Molecular Neurobiology"].includes(n.discipline)) return "neurobiology";
  if (["Systems Neuroscience","Computational Neuroscience","Network Neuroscience","Cognitive Neuroscience","Sensory Neuroscience","Neuroimaging"].includes(n.discipline)) return "neuroscience";
  if (["Neurology","Biomedical Engineering","Precision Medicine","Population Health","Systems Medicine"].includes(n.discipline)) return "medicine";
  if (["Climate Science","Geology","Earth System Science","Oceanography","Earth Observation"].includes(n.discipline)) return "earth_science";
  if (["Systems Science","Scientific Computing","Data Science","Philosophy of Science","Metrology"].includes(n.discipline)) return "systems_science";
  if (["Biochemistry","Structural Biology","Computational Chemistry","Physical Chemistry","Chemistry"].includes(n.discipline)) return n.discipline === "Chemistry" || n.discipline === "Physical Chemistry" ? "chemistry" : "biochemistry";
  return "biology";
};
const hubs = new Set(["mathematics","physics","computer_science","biology","chemistry","biochemistry","neurobiology","neuroscience","earth_science","astronomy","systems_science","medicine","engineering"]);
nodes.filter(n => !hubs.has(n.id)).forEach(n => link(n.id, hubFor(n), "part_of", .96, true));

// Curated conceptual and methodological connections.
[
  ["logic","set_theory","grounds"],["set_theory","topology","supports"],["set_theory","probability","supports"],["category_theory","abstract_algebra","unifies"],
  ["category_theory","topology","unifies"],["linear_algebra","functional_analysis","supports"],["linear_algebra","differential_equations","supports"],["abstract_algebra","group_theory","contains"],
  ["abstract_algebra","ring_theory","contains"],["group_theory","symmetry_breaking","models"],["group_theory","cryptography","supports"],["number_theory","cryptography","supports"],
  ["calculus","real_analysis","formalized_by"],["calculus","differential_equations","supports"],["real_analysis","probability","supports"],["complex_analysis","quantum_field_theory","supports"],
  ["functional_analysis","quantum_mechanics","supports"],["differential_geometry","general_relativity","language_of"],["topology","tda","enables"],["graph_theory","network_science","supports"],
  ["probability","statistics","supports"],["probability","statistical_mechanics","supports"],["probability","machine_learning","supports"],["bayesian_inference","statistics","part_of"],
  ["bayesian_inference","predictive_coding","informs"],["information_theory","statistics","connects"],["information_theory","computer_science","supports"],["optimization","machine_learning","enables"],
  ["numerical_analysis","computational_modeling","enables"],["dynamical_systems","nonlinear_dynamics","contains"],["dynamical_systems","control_theory","supports"],["game_theory","reinforcement_learning","informs"],
  ["classical_mechanics","special_relativity","extended_by"],["classical_mechanics","fluid_dynamics","supports"],["thermodynamics","statistical_mechanics","explained_by"],["statistical_mechanics","information_theory","connects"],
  ["electromagnetism","optics","explains"],["electromagnetism","special_relativity","consistent_with"],["special_relativity","general_relativity","generalized_by"],["quantum_mechanics","quantum_field_theory","generalized_by"],
  ["quantum_field_theory","standard_model","implements"],["standard_model","particle_physics","explains"],["quantum_mechanics","quantum_chemistry","enables"],["quantum_mechanics","quantum_computing","enables"],
  ["quantum_mechanics","wave_particle_duality","explains"],["symmetry_breaking","standard_model","organizes"],["general_relativity","black_holes","predicts"],["general_relativity","gravitational_waves","predicts"],
  ["stellar_evolution","black_holes","produces"],["nuclear_physics","stellar_evolution","explains"],["plasma_physics","stellar_evolution","supports"],["cosmology","big_bang","modeled_by"],
  ["cosmology","dark_matter","studies"],["cosmology","dark_energy","studies"],["dark_matter","galaxy_dynamics","explains"],["optics","remote_sensing","enables"],
  ["algorithms","data_structures","uses"],["logic","computability","supports"],["computability","complexity_theory","precedes"],["programming_languages","algorithms","expresses"],
  ["operating_systems","distributed_systems","supports"],["computer_networks","distributed_systems","supports"],["databases","distributed_systems","implemented_as"],["cryptography","computer_networks","secures"],
  ["artificial_intelligence","machine_learning","contains"],["machine_learning","deep_learning","contains"],["machine_learning","statistics","uses"],["deep_learning","transformers","contains"],
  ["deep_learning","graph_neural_networks","contains"],["transformers","natural_language_processing","powers"],["deep_learning","computer_vision","powers"],["reinforcement_learning","robotics","controls"],
  ["control_theory","robotics","supports"],["graph_theory","graph_neural_networks","structures"],["information_theory","deep_learning","analyzes"],["tda","machine_learning","augments"],
  ["cell_biology","molecular_biology","connects"],["molecular_biology","genetics","supports"],["genetics","evolution","supports"],["evolution","natural_selection","driven_by"],
  ["genetics","population_genetics","contains"],["ecology","evolution","interacts_with"],["developmental_biology","gene_regulation","depends_on"],["epigenetics","gene_regulation","modulates"],
  ["dna","gene","contains"],["gene","genome","part_of"],["dna","rna","transcribed_to"],["rna","protein","translated_to"],["protein","enzyme","can_form"],
  ["enzyme","metabolism","catalyzes"],["atp","metabolism","couples_energy_in"],["cellular_respiration","atp","produces"],["photosynthesis","metabolism","feeds"],
  ["protein_folding","protein","shapes"],["molecular_dynamics","protein_folding","models"],["quantum_chemistry","chemical_bonding","explains"],["reaction_kinetics","enzyme","models"],
  ["organic_chemistry","biochemistry","supports"],["microbiology","virology","contains"],["immunology","virology","responds_to"],["synthetic_biology","gene_regulation","engineers"],
  ["bioinformatics","genomics","enables"],["bioinformatics","machine_learning","uses"],["systems_biology","network_science","uses"],["systems_biology","metabolism","models"],
  ["neuron","action_potential","generates"],["neuron","synapse","forms"],["synapse","neurotransmitter","uses"],["neural_plasticity","synapse","modifies"],
  ["hebbian_learning","neural_plasticity","models"],["neural_coding","information_theory","uses"],["brain_networks","connectome","analyzes"],["brain_networks","network_science","uses"],
  ["predictive_coding","bayesian_inference","uses"],["memory","neural_plasticity","depends_on"],["attention","predictive_coding","interacts_with"],["vision","computer_vision","inspires"],
  ["motor_control","control_theory","modeled_by"],["brain_computer_interface","neural_coding","decodes"],["fmri","brain_networks","measures"],["eeg","neural_coding","measures"],
  ["glia","synapse","modulates"],["neurodegeneration","neuron","damages"],["deep_learning","neuroscience","inspired_by"],["consciousness","brain_networks","investigated_via"],
  ["climate_system","fluid_dynamics","uses"],["climate_system","thermodynamics","uses"],["climate_system","carbon_cycle","couples"],["ocean_circulation","climate_system","regulates"],
  ["plate_tectonics","dynamical_systems","modeled_by"],["remote_sensing","climate_system","observes"],["carbon_cycle","photosynthesis","couples"],["ecology","climate_system","interacts_with"],
  ["complex_systems","emergence","exhibits"],["complex_systems","network_science","uses"],["agent_based_modeling","complex_systems","models"],["nonlinear_dynamics","complex_systems","explains"],
  ["scientific_method","measurement","requires"],["statistics","scientific_method","supports"],["causal_inference","statistics","extends"],["causal_inference","epidemiology","supports"],
  ["computational_modeling","differential_equations","implements"],["computational_modeling","agent_based_modeling","includes"],["medical_imaging","fmri","includes"],["genomics","systems_medicine","supports"],
  ["epidemiology","systems_medicine","informs"],["systems_medicine","systems_biology","uses"],["machine_learning","medical_imaging","analyzes"],["machine_learning","genomics","analyzes"],
  ["tda","brain_networks","analyzes"],["tda","protein_folding","analyzes"],["graph_neural_networks","molecular_biology","models"],["quantum_computing","cryptography","challenges"],
  ["information_theory","genetics","interprets"],["dynamical_systems","gene_regulation","models"],["optimization","protein_folding","models"],["fluid_dynamics","ocean_circulation","models"]
].forEach(([a,b,r],i) => link(a,b,r,Math.round((.58 + (i % 8) * .05) * 100) / 100,true));

// A few explicitly symmetric conceptual analogies and interactions.
[
  ["neural_networks","brain_networks","analogous_to"],
  ["entropy_thermodynamic","information_theory","analogous_to"],
  ["gene_regulation","control_theory","analogous_to"],
  ["ecosystem_networks","network_science","modeled_by"]
].forEach(() => {}); // Reserved examples are intentionally omitted unless both endpoints exist.
[
  ["ecology","carbon_cycle","interacts_with"],["protein","rna","interacts_with"],["attention","memory","interacts_with"],
  ["dark_matter","dark_energy","contrasted_with"],["biology","chemistry","bridges"],["neurobiology","neuroscience","bridges"],
  ["mathematics","computer_science","bridges"],["physics","chemistry","bridges"],["biochemistry","molecular_biology","bridges"],
  ["systems_science","engineering","bridges"]
].forEach(([a,b,r],i) => link(a,b,r,.62 + (i % 5) * .04,false));

function csv(rows, headers) {
  const quote = value => { const text = String(value ?? ""); return /[",\n\r]/.test(text) ? `"${text.replace(/"/g,'""')}"` : text; };
  return [headers.join(","), ...rows.map(row => headers.map(h => quote(row[h])).join(","))].join("\n") + "\n";
}

const nodeIds = new Set(nodes.map(n => n.id));
if (nodeIds.size !== nodes.length) throw new Error("Duplicate node ID detected");
for (const edge of edges) if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) throw new Error(`Unknown endpoint: ${edge.source} -> ${edge.target}`);
const edgeKeys = new Set();
for (const edge of edges) {
  const pair = edge.directed ? `${edge.source}>${edge.target}` : [edge.source,edge.target].sort().join("~");
  const key = `${pair}|${edge.relation}`; if (edgeKeys.has(key)) throw new Error(`Duplicate edge: ${key}`); edgeKeys.add(key);
}

fs.writeFileSync(path.join(here,"science_world_nodes.csv"),csv(nodes,["id","label","category","domain","discipline","level","importance","complexity","description"]));
fs.writeFileSync(path.join(here,"science_world_edges.csv"),csv(edges,["source","target","relation","weight","directed"]));
console.log(JSON.stringify({nodes:nodes.length,edges:edges.length,domains:new Set(nodes.map(n=>n.domain)).size,categories:new Set(nodes.map(n=>n.category)).size,relations:new Set(edges.map(e=>e.relation)).size}));
