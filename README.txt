Welcome to the health manager!

To build the docker image, navigate to the directory and run:
	docker build -t rosskahn/hpmanager .

We'll be using port 3000. When you're ready to run the container:
	docker run -p 3000:3000 rosskahn/hpmanager
	
The character "Briv" is pre-loaded into the image. To see Briv's character sheet:
	GET http://localhost:3000/api/characters/briv

To create a new character 'evan' from JSON:
	POST http://localhost:3000/api/characters/create/evan
	
	Make sure the header has {"Content-Type": "application/json"}
	Then put valid JSON into the body and ship it!
	
	The console will output the character sheet in JSON.
	
To damage Briv with 10 points of slashing damage:
	PUT http://localhost:3000/api/damage/briv/type/slashing/amount/10
	
	Supported damage types:
		slashing
		piercing
		bludgeoning
		poison
		acid
		fire
		cold
		radiant
		necrotic
		lightning
		thunder
		force
		psychic
		
	Amount cannot be negative.
	
	The console output might look like this:
		> Briv took 10 points of slashing damage, but is resistant!
		> Briv now has 40/45 HP and 0 temporary HP.
		
To heal Briv's HP by 10 points:
	PUT http://localhost:3000/api/heal/briv/amount/10
	
	Amount cannot be negative.
	
	The console output might look like this:
		> Briv was healed by 10 points!
		> Briv now has 45/45 HP and 0 temporary HP.
	
To add 10 temporary hitpoints to briv:
	PUT http://localhost:3000/api/temphp/briv/amount/10

	Amount cannot be negative.
	
	The console output might look like this:
		> Briv now has 10 temporary HP!
		> Briv has 45/45 HP and 10 temporary HP.
 
If you want to clear out the application's persistent data, open up the docker CLI and rm the files you don't want. This will clear any new characters you've made, but good ole' Briv will still be in there (his data will just be reset):
	/usr/src/app # cd src
	/usr/src/app/src # cd data/
	/usr/src/app/src/data # rm briv.json
	/usr/src/app/src/data # rm ross.json


