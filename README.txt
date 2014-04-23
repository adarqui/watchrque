Watches for create, update, and/or delete events on directories. When an event triggers, this code will fire off a resque event or exec a local script.


Usage:
	./watchrque.js [<redis:port>|</path/to/bin/directory>] "<Class1>:<Queue1>:<Events>:<Directory1,...,DirectoryN>" ... <ClassN>:<QueueN>:<Events>:<Directory1,...,DirectoryN>"

	Events:

		c = create
		u = update
		d = delete
		a = {create, update, delete}

		No relation to nvidia.


Example usage:

	Resque:

		./watchrque.js 127.0.0.1:6379 "CreateClass:CreateQueue:c:/tmp/c" "UpdateClass:UpdateQueue:u:/tmp/u" "DeleteClass:DeleteQueue:d:/tmp/d" "AllClass:AllQueue:a:/tmp/a" "AllClass2:AllQueue2:cud:/tmp/cud"

	Local:

		./watchrque.js /tmp/bin "CreateClass:CreateQueue:c:/tmp/c" "UpdateClass:UpdateQueue:u:/tmp/u" "DeleteClass:DeleteQueue:d:/tmp/d" "AllClass:AllQue:a:/tmp/a" "AllClass2:AllQueue2:cud:/tmp/cud"


When running watchrque in 'local mode', it will infer the binary path via <path>/<class>/<queue> and pass the arguments in this order:

	class queue filepath path event

	So for the example above: if a file is created in /tmp/c/hi, the following will execute:

	/tmp/bin/CreateClass/CreateQueue CreateClass CreateQueue /tmp/c/hi /tmp/c create


That's it.

oo.
