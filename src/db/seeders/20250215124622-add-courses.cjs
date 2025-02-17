'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.sequelize.query(
            `            
            -- inserting semester1 courses for scheme nep 2020
            INSERT INTO Courses(course_code, course_name, scheme_id) VALUES
                ('BSC101', 'Applied Mathematics - I', 2),
                ('BSC102', 'Applied Physics', 2),
                ('BSC103', 'Applied Chemistry', 2),
                ('ESC101', 'Engineering Mechanics', 2),
                ('ESC102', 'Basic Electrical & Electronics Engineering', 2),
                ('BSL101', 'Applied Physics Lab', 2),
                ('BSL102', 'Applied Chemistry Lab', 2),
                ('ESL101', 'Engineering Mechanics Lab', 2),
                ('ESL102', 'Basic Electrical & Electronics Engineering Lab', 2),
                ('AEC101', 'Professional and Communication Ethics', 2),
                ('AEL101', 'Professional and Communication Ethics Lab', 2),
                ('SEC101', 'Engineering Workshop-I', 2),
                ('VSEC102', 'C Programming', 2),
                ('CC101', 'Induction cum Universal Human Values', 2);

            -- inserting semester2 courses for scheme nep 2020
            INSERT INTO Courses(course_code, course_name, scheme_id) VALUES
                ('BSC201', 'Applied Mathematics - II', 2),
                ('BSC202X', 'Elective Physics', 2),
                ('BSC203X', 'Elective Chemistry', 2),
                ('ESC201', 'Engineering Graphics', 2),
                ('PCC201X', 'Program Core Course', 2),
                ('BSL201X', 'Elective Physics Lab', 2),
                ('BSL202X', 'Elective Chemistry Lab', 2),
                ('ESL201', 'Engineering Graphics Lab', 2),
                ('PCL201X', 'Program Core Lab', 2),
                ('CC201', 'Social Science & Community Services', 2),
                ('IKS201', 'Indian knowledge System', 2),
                ('VSEC201', 'Engineering Workshop-II', 2),
                ('VSEC202', 'Python Programming', 2);

            -- inserting semester3 courses for scheme rev 2019 c  (comp)
            INSERT INTO Courses(course_code, course_name, scheme_id) VALUES
                ('CSC301', 'Engineering Mathematics-III', 1),
                ('CSC302', 'Discrete Structures and Graph Theory', 1),
                ('CSC303', 'Data Structure', 1),
                ('CSC304', 'Digital Logic & Computer Architecture', 1),
                ('CSC305', 'Computer Graphics', 1),
                ('CSL301', 'Data Structure Lab', 1),
                ('CSL302', 'Digital Logic & Computer Architecture Lab', 1),
                ('CSL303', 'Computer Graphics Lab', 1),
                ('CSL304', 'Skill base Lab course: Object Oriented Programming with Java', 1),
                ('CSM301', 'Mini Project - 1A', 1);

            -- inserting semester4 courses for scheme rev 2019 c (comp)
            INSERT INTO Courses(course_code, course_name, scheme_id) VALUES
                ('CSC401', 'Engineering Mathematics-IV', 1),
                ('CSC402', 'Analysis of Algorithm', 1),
                ('CSC403', 'Database Management System', 1),
                ('CSC404', 'Operating System', 1),
                ('CSC405', 'Microprocessor', 1),
                ('CSL401', 'Analysis of Algorithm Lab', 1),
                ('CSL402', 'Database Management System Lab', 1),
                ('CSL403', 'Operating System Lab', 1),
                ('CSL404', 'Microprocessor Lab', 1),
                ('CSL405', 'Skill Base Lab Course: Python Programming', 1),
                ('CSM401', 'Mini Project - 1B', 1);

            -- inserting semester5 courses for scheme rev 2019 c (comp)
            INSERT INTO Courses(course_code, course_name, scheme_id) VALUES
                ('CSC501', 'Theoretical Computer Science', 1),
                ('CSC502', 'Software Engineering', 1),
                ('CSC503', 'Computer Network', 1),
                ('CSC504', 'Data Warehousing & Mining', 1),
                ('CSL501', 'Software Engineering Lab', 1),
                ('CSL502', 'Computer Network Lab', 1),
                ('CSL503', 'Data Warehousing & Mining Lab', 1),
                ('CSL504', 'Business Comm. & Ethics II', 1),
                ('CSM501', 'Mini Project - 2A', 1);

            INSERT INTO Courses(course_code, course_name, scheme_id, course_optional_subject) VALUES
                ('CSDLO5011', 'Probabilistic Graphical Models', 1, 'CSDLO501'),
                ('CSDLO5012', 'Internet Programming', 1, 'CSDLO501'),
                ('CSDLO5013', 'Advance Database Management System', 1, 'CSDLO501');

            -- inserting semester6 courses for scheme rev 2019 c (comp)
            INSERT INTO Courses(course_code, course_name, scheme_id) VALUES
                ('CSC601', 'System Programming & Compiler Construction', 1),
                ('CSC602', 'Cryptography & System Security', 1),
                ('CSC603', 'Mobile Computing', 1),
                ('CSC604', 'Artificial Intelligence', 1),
                ('CSL601', 'System Programming & Compiler Construction Lab', 1),
                ('CSL602', 'Cryptography & System Security Lab', 1),
                ('CSL603', 'Mobile Computing Lab', 1),
                ('CSL604', 'Artificial Intelligence Lab', 1),
                ('CSL605', 'Skill base Lab Course: Cloud Computing', 1),
                ('CSM601', 'Mini Project - 2B', 1);

            INSERT INTO Courses(course_code, course_name, scheme_id, course_optional_subject) VALUES
                ('CSDLO6011', 'Internet of Things', 1, 'CSDLO601'),
                ('CSDLO6012', 'Digital Signal & Image Processing', 1, 'CSDLO601'),
                ('CSDLO6013', 'Quantitative Analysis', 1, 'CSDLO601');

            -- inserting semester7 courses for scheme rev 2019 c (comp)
            INSERT INTO Courses(course_code, course_name, scheme_id) VALUES
                ('CSC701', 'Machine Learning', 1),
                ('CSC702', 'Big Data Analytics', 1),
                ('CSL701', 'Machine Learning Lab', 1),
                ('CSL702', 'Big Data Analytics Lab', 1),
                ('CSP701', 'Major Project 1', 1);

            INSERT INTO Courses(course_code, course_name, scheme_id, course_optional_subject) VALUES
                ('CSDC7011', 'Machine Vision', 1, 'CSDC701'),
                ('CSDC7012', 'Quantum Computing', 1, 'CSDC701'),
                ('CSDC7013', 'Natural Language Processing', 1, 'CSDC701'),

                ('CSDL7011', 'Machine Vision lab', 1, 'CSDL701'),
                ('CSDL7012', 'Quantum Computing lab', 1, 'CSDL701'),
                ('CSDL7013', 'Natural Language Processing lab', 1, 'CSDL701'),

                ('CSDC7021', 'Augmented and Virtual Reality', 1, 'CSDC702'),
                ('CSDC7022', 'Block Chain', 1, 'CSDC702'),
                ('CSDC7023', 'Information Retrieval', 1, 'CSDC702'),

                ('CSDL7021', 'Augmented and Virtual Reality lab', 1, 'CSDL702'),
                ('CSDL7022', 'Block Chain lab', 1, 'CSDL702'),
                ('CSDL7023', 'Information Retrieval lab', 1, 'CSDL702');


            -- inserting semester8 courses for scheme rev 2019 c (comp)
            INSERT INTO Courses(course_code, course_name, scheme_id) VALUES
                ('CSC801', 'Distributed Computing', 1),
                ('CSL801', 'Distributed Computing Lab', 1),
                ('CSP801', 'Major Project 2', 1);

            INSERT INTO Courses(course_code, course_name, scheme_id, course_optional_subject) VALUES
                ('CSDC8011', 'Deep Learning', 1, 'CSDC801'),
                ('CSDC8012', 'Digital Forensic', 1, 'CSDC801'),
                ('CSDC8013', 'Applied Data Science', 1, 'CSDC801'),

                ('CSDL8011', 'Deep Learning Lab', 1, 'CSDL801'),
                ('CSDL8012', 'Digital Forensic Lab', 1, 'CSDL801'),
                ('CSDL8013', 'Applied Data Science Lab', 1, 'CSDL801'),

                ('CSDC8021', 'Optimization in Machine Learning', 1, 'CSDC802'),
                ('CSDC8022', 'High Performance Computing', 1, 'CSDC802'),
                ('CSDC8023', 'Social Media Analytics', 1, 'CSDC802'),

                ('CSDL8021', 'Optimization in Machine Learning Lab', 1, 'CSDL802'),
                ('CSDL8022', 'High Performance Computing Lab', 1, 'CSDL802'),
                ('CSDL8023', 'Social Media Analytics Lab', 1, 'CSDL802');

            -- inserting semester3 courses for scheme rev 2019 c (civil)
            INSERT INTO Courses(course_code, course_name, scheme_id) VALUES
                ('CEC301', 'Engineering Mathematics-III', 1),
                ('CEC302', 'Mechanics of Solids', 1),
                ('CEC303', 'Engineering Geology', 1),
                ('CEC304', 'Architectural Planning & Design of Buildings', 1),
                ('CEC305', 'Fluid Mechanics- I', 1),
                ('CEL301', 'Mechanics of Solids Lab', 1),
                ('CEL302', 'Engineering Geology Lab', 1),
                ('CEL303', 'Architectural Planning & Design of Buildings Lab', 1),
                ('CEL304', 'Fluid Mechanics- I Lab', 1),
                ('CEL305', 'Skill Based Lab Course-I', 1),
                ('CEM301', 'Mini Project - 1 A', 1);

            -- inserting semester4 courses for scheme rev 2019 c (civil)
            INSERT INTO Courses(course_code, course_name, scheme_id) VALUES
                ('CEC401', 'Engineering Mathematics - IV', 1),
                ('CEC402', 'Structural Analysis', 1),
                ('CEC403', 'Surveying', 1),
                ('CEC404', 'Building Materials & Concrete Technology', 1),
                ('CEC405', 'Fluid Mechanics-II', 1),
                ('CEL401', 'Structural Analysis Lab', 1),
                ('CEL402', 'Surveying Lab', 1),
                ('CEL403', 'Building Material Concrete Technology Lab', 1),
                ('CEL404', 'Fluid Mechanics-II Lab', 1),
                ('CEL405', 'Skill Based lab Course-II', 1),
                ('CEM401', 'Mini Project - 1 B', 1);

            -- inserting semester5 courses for scheme rev 2019 c (civil)
            INSERT INTO Courses(course_code, course_name, scheme_id) VALUES
                ('CEC501', 'Theory of Reinforced Concrete Structures', 1),
                ('CEC502', 'Applied Hydraulics', 1),
                ('CEC503', 'Geotechnical Engineering-I', 1),
                ('CEC504', 'Transportation Engineering', 1),
                ('CEL501', 'Theory of Reinforced Concrete Structures Lab', 1),
                ('CEL502', 'Applied Hydraulics Lab', 1),
                ('CEL503', 'Geotechnical Engineering-I Lab', 1),
                ('CEL504', 'Transportation Engineering Lab', 1),
                ('CEL505', 'Professional Communication and Ethics Lab', 1),
                ('CEM501', 'Mini Project - 2A', 1);

            INSERT INTO Courses(course_code, course_name, scheme_id, course_optional_subject) VALUES
                ('CEDLO5011', 'Modern Surveying Instruments and Techniques', 1, 'CEDLO501'),
                ('CEDLO5012', 'Building Services & Repairs', 1, 'CEDLO501'),
                ('CEDLO5013', 'Sustainable Building Materials', 1, 'CEDLO501'),
                ('CEDLO5014', 'Advanced Structural Mechanics', 1, 'CEDLO501'),
                ('CEDLO5015', 'Air and Noise Pollution & Control', 1, 'CEDLO501'),
                ('CEDLO5016', 'Transportation Planning & Economics', 1, 'CEDLO501'),
                ('CEDLO5017', 'Advanced Concrete Technology', 1, 'CEDLO501');

            -- inserting semester6 courses for scheme rev 2019 c (civil)
            INSERT INTO Courses(course_code, course_name, scheme_id) VALUES
                ('CEC601', 'Design & Drawing of Steel Structures', 1),
                ('CEC602', 'Water Resources Engineering', 1),
                ('CEC603', 'Geotechnical Engineering-II', 1),
                ('CEC604', 'Environmental Engineering', 1),
                ('CEL601', 'Design & Drawing of Steel Structures Lab', 1),
                ('CEL602', 'Water Resources Engineering Lab', 1),
                ('CEL603', 'Geotechnical Engineering-II Lab', 1),
                ('CEL604', 'Environmental Engineering Lab', 1),
                ('CEL605', 'Skill Based Lab Course - III', 1),
                ('CEM601', 'Mini Project-2B', 1);

            INSERT INTO Courses(course_code, course_name, scheme_id, course_optional_subject) VALUES
                ('CEDLO6011', 'Rock Mechanics', 1, 'CEDLO601'),
                ('CEDLO6012', 'Biological Processes & Contaminant Removal', 1, 'CEDLO601'),
                ('CEDLO6013', 'Construction Equipment & Techniques', 1, 'CEDLO601'),
                ('CEDLO6014', 'Urban Infrastructure Planning', 1, 'CEDLO601'),
                ('CEDLO6015', 'Open Channel Flow', 1, 'CEDLO601'),
                ('CEDLO6016', 'Computational Structural Analysis', 1, 'CEDLO601'),
                ('CEDLO6017', 'Traffic Engineering and Management', 1, 'CEDLO601'),
                ('CEDLO6018', 'Introduction to Offshore Engineering', 1, 'CEDLO601');

            -- inserting semester7 courses for scheme rev 2019 c (civil)
            INSERT INTO Courses(course_code, course_name, scheme_id) VALUES
                ('CEC701', 'Design & Drawing of Reinforced Concrete Structures', 1),
                ('CEC702', 'Quantity Survey, Estimation and Valuation', 1),
                ('CEL701', 'Design & Drawing of Reinforced Concrete Structures Lab', 1),
                ('CEL702', 'Quantity Survey, Estimation and Valuation Lab', 1),
                ('CEP701', 'Major Project-Part I', 1);

            INSERT INTO Courses(course_code, course_name, scheme_id, course_optional_subject) VALUES
                ('CEDLO7011', 'Pre-stressed Concrete', 1, 'CEDLO701'),
                ('CEDLO7012', 'Applied Hydrology and Flood Control', 1, 'CEDLO701'),
                ('CEDLO7013', 'Appraisal and Implementation of Infra Projects', 1, 'CEDLO701'),
                ('CEDLO7014', 'Analysis of Offshore Structures', 1, 'CEDLO701'),
                ('CEDLO7015', 'Advanced Construction Technology', 1, 'CEDLO701'),
                ('CEDLO7016', 'Pavement Materials Construction and Maintenance', 1, 'CEDLO701'),

                ('CEDLO7021', 'Foundation Analysis and Design', 1, 'CEDLO702'),
                ('CEDLO7022', 'Solid and Hazardous Waste Management', 1, 'CEDLO702'),
                ('CEDLO7023', 'Ground Improvement techniques', 1, 'CEDLO702'),
                ('CEDLO7024', 'Green building constructions', 1, 'CEDLO702'),
                ('CEDLO7025', 'Legal Aspects in constructions', 1, 'CEDLO702'),
                ('CEDLO7026', 'Environmental impact assessment', 1, 'CEDLO702'),
                ('CEDLO7027', 'Advanced Design of Steel Structures', 1, 'CEDLO702');

            -- inserting semester 7 optional subject for both civil and comp 
            INSERT INTO Courses(course_code, course_name, scheme_id, course_optional_subject) VALUES
                ('ILO7011', 'Product Lifecycle Management', 1, 'ILO701'),  
                ('ILO7012', 'Reliability Engineering', 1, 'ILO701'),
                ('ILO7013', 'Management Information Systems', 1, 'ILO701'),
                ('ILO7014', 'Design of Experiments', 1, 'ILO701'),
                ('ILO7015', 'Operations Research', 1, 'ILO701'),
                ('ILO7016', 'Cyber Security and Laws', 1, 'ILO701'),
                ('ILO7017', 'Disaster Management and Mitigation Measures', 1, 'ILO701'),
                ('ILO7018', 'Energy Audit and Management', 1, 'ILO701'),
                ('ILO7019', 'Development Engineering', 1, 'ILO701');


            -- inserting semester8 courses for scheme rev 2019 c (civil)
            INSERT INTO Courses(course_code, course_name, scheme_id) VALUES
                ('CEC801', 'Construction Management', 1),
                ('CEL801', 'Construction Management Lab', 1),
                ('CEP801', 'Major Project - Part II', 1);

            INSERT INTO Courses(course_code, course_name, scheme_id, course_optional_subject) VALUES
                ('CEDLO8011', 'Bridge Engineering', 1, 'CEDLO801'),
                ('CEDLO8012', 'Design of Hydraulics Structures', 1, 'CEDLO801'),
                ('CEDLO8013', 'Construction Safety', 1, 'CEDLO801'),
                ('CEDLO8014', 'Pavement Design', 1, 'CEDLO801'),
                ('CEDLO8015', 'Industrial Waste Treatment', 1, 'CEDLO801'),
                ('CEDLO8016', 'Soil Dynamics', 1, 'CEDLO801'),

                ('CEDLO8021', 'Repairs, Rehabilitation and Retrofitting of structures', 1, 'CEDLO802'),
                ('CEDLO8022', 'Physico-Chemical Treatment of Water and Waste Water', 1, 'CEDLO802'),
                ('CEDLO8023', 'Transportation System Engineering', 1, 'CEDLO802'),
                ('CEDLO8024', 'Smart Building Materials', 1, 'CEDLO802'),
                ('CEDLO8025', 'Structural Dynamics', 1, 'CEDLO802'),
                ('CEDLO8026', 'Ground Water Engineering', 1, 'CEDLO802');

            -- inserting semester 8 optional courses for both civil and comp
            INSERT INTO Courses(course_code, course_name, scheme_id, course_optional_subject) VALUES
                ('ILO8021', 'Project Management', 1, 'ILO802'),  
                ('ILO8022', 'Finance Management', 1, 'ILO802'),
                ('ILO8023', 'Entrepreneurship Development and Management', 1, 'ILO802'),
                ('ILO8024', 'Human Resource Management', 1, 'ILO802'),
                ('ILO8025', 'Professional Ethics and CSR', 1, 'ILO802'),
                ('ILO8026', 'Research Methodology', 1, 'ILO802'),
                ('ILO8027', 'IPR and Patenting', 1, 'ILO802'),
                ('ILO8028', 'Digital Business Management', 1, 'ILO802'),
                ('ILO8029', 'Environmental Management', 1, 'ILO802');
            `
        )
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.sequelize.query(
            `Delete from courses`
        )
    }
};
