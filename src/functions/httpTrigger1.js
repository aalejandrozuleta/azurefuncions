const { app } = require("@azure/functions");
const Handlebars = require("handlebars");
const { EmailClient } = require("@azure/communication-email");
const fs = require("fs");
const path = require("path");

const connectionString =
  "endpoint=https://correos.unitedstates.communication.azure.com/;accesskey=Dt3YnV6L3rEVywF79AXj5H4uQRAgq1dZY5Z6NEPg6U4mEblSU2eGJQQJ99AHACULyCps5mg0AAAAAZCStj2g";
const client = new EmailClient(connectionString);

app.http("httpTrigger1", {
  methods: ["POST"],
  handler: async (request, context) => {
    try {
      // Obtener datos de la solicitud
      const requestData = await request.json();
      const subject = requestData.subject;
      const templateName = requestData.templateName;  // Asegúrate de que este nombre coincida con el del JSON
      const dataTemplate = requestData.dataTemplate;
      const to = requestData.to;
      console.log(requestData);
      console.log(dataTemplate);
      

      // Validar templateName
      if (typeof templateName !== 'string' || !templateName.trim()) {
        console.error("El nombre de la plantilla no es válido:", templateName);
        return { status: 400, body: "El nombre de la plantilla no es válido." };
      }

      // Leer y compilar la plantilla
      const templatePath = path.join(__dirname, templateName);
      console.log("Ruta de la plantilla:", templatePath);
      let source;
      try {
        source = fs.readFileSync(templatePath, "utf-8");
      } catch (fileError) {
        console.error("Error al leer el archivo de plantilla:", fileError);
        return { status: 500, body: "Error al leer el archivo de plantilla." };
      }

      let template;
      try {
        template = Handlebars.compile(source);
      } catch (compileError) {
        console.error("Error al compilar la plantilla:", compileError);
        return { status: 500, body: "Error al compilar la plantilla." };
      }

      // Generar el HTML de la plantilla
      let html;
      try {
        html = template({ name: dataTemplate.name });
      } catch (renderError) {
        console.error("Error al renderizar la plantilla:", renderError);
        return { status: 500, body: "Error al renderizar la plantilla." };
      }

      // Configurar el mensaje de correo
      const emailMessage = {
        senderAddress: "DoNotReply@12683ac3-0be3-4901-9b05-23170fbc5f06.azurecomm.net",
        content: {
          subject: subject,
          html: html,
        },
        recipients: {
          to: [{ address: to }],
        },
      };

      // Enviar el correo
      let result;
      try {
        const poller = await client.beginSend(emailMessage);
        result = await poller.pollUntilDone();
      } catch (sendError) {
        console.error("Error al enviar el correo:", sendError);
        return { status: 500, body: "Error al enviar el correo." };
      }

      return { body: "Correo enviado exitosamente" };
    } catch (error) {
      console.error("Error inesperado:", error);
      return { status: 500, body: "Error inesperado al procesar la solicitud." };
    }
  },
});



