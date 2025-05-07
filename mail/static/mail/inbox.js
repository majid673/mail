document.addEventListener('DOMContentLoaded', function () {
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', send_email);
  load_mailbox('inbox');
});

function compose_email() {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-detail-view').style.display = 'none';

  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function send_email(event) {
  event.preventDefault();

  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
    .then(response => response.json())
    .then(result => {
      console.log(result);
      load_mailbox('sent');
    });
}

function load_mailbox(mailbox) {
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-detail-view').style.display = 'none';

  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      emails.forEach(email => {
        const emailDiv = document.createElement('div');
        emailDiv.className = 'email-item';
        emailDiv.style.border = '1px solid #ccc';
        emailDiv.style.padding = '10px';
        emailDiv.style.margin = '5px';
        emailDiv.style.cursor = 'pointer';
        emailDiv.style.backgroundColor = email.read ? '#e0e0e0' : 'white';

        emailDiv.innerHTML = `
          <strong>${mailbox === 'sent' ? 'To: ' + email.recipients.join(', ') : email.sender}</strong>
          <span style="margin-left: 10px;"><strong>${email.subject}</strong></span>
          <span style="float: right;">${email.timestamp}</span>
        `;

        emailDiv.addEventListener('click', () => {
          view_email(email.id, mailbox);
        });

        document.querySelector('#emails-view').append(emailDiv);
      });
    });
}

function view_email(id, mailbox) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-detail-view').style.display = 'block';

  fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
      fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ read: true })
      });

      document.querySelector('#email-detail-view').innerHTML = `
        <ul class="list-group mb-3">
          <li class="list-group-item"><strong>From:</strong> ${email.sender}</li>
          <li class="list-group-item"><strong>To:</strong> ${email.recipients.join(', ')}</li>
          <li class="list-group-item"><strong>Subject:</strong> ${email.subject}</li>
          <li class="list-group-item"><strong>Timestamp:</strong> ${email.timestamp}</li>
        </ul>
        <div class="mb-3">
          <pre>${email.body}</pre>
        </div>
        <button class="btn btn-sm btn-outline-primary" id="reply">Reply</button>
      `;

     
      if (mailbox !== 'sent') {
        const archiveBtn = document.createElement('button');
        archiveBtn.className = 'btn btn-sm btn-outline-primary ml-2';
        archiveBtn.id = 'toggle-archive';
        archiveBtn.innerText = email.archived ? 'Unarchive' : 'Archive';

        archiveBtn.addEventListener('click', () => {
          fetch(`/emails/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ archived: !email.archived })
          })
            .then(() => load_mailbox('inbox'));
        });

        document.querySelector('#email-detail-view').append(archiveBtn);
      }

      document.querySelector('#reply').addEventListener('click', () => reply_email(email));
    });
}

function reply_email(email) {
  compose_email();

  document.querySelector('#compose-recipients').value = email.sender;

  let subject = email.subject;
  if (!subject.startsWith('Re:')) {
    subject = 'Re: ' + subject;
  }
  document.querySelector('#compose-subject').value = subject;

  const quoted_body = `\n\nOn ${email.timestamp}, ${email.sender} wrote:\n${email.body}`;
  document.querySelector('#compose-body').value = quoted_body;
}
